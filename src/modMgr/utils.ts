// Use existing modules if available, otherwise import them
// On module load, shared dependencies will be installed automatically if shared.json exists.
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const os = (global as unknown as { os: typeof import("os") }).os || require("os");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");
const childProcess = (global as unknown as { childProcess: typeof import("child_process") }).childProcess || require("child_process");

// implement a class of json object that automatically saves to a file
class JsonFile<T> {
    private _data: T;
    private filePath: string;
    private _modifiedTime : number = 0;

    constructor(filePath: string, initialData: T) {
        this.filePath = filePath;
        this._data = initialData;
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
        }
        this.refresh();
    }

    refresh(){
        this._data = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
        this._modifiedTime = fs.statSync(this.filePath).mtime.getTime();
    }

    get data(): T {
        if (fs.statSync(this.filePath).mtime.getTime() > this._modifiedTime) {
            this.refresh();
        }
        return this._data;
    }

    set data(data: T) {
        this._data = data;
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }
    getValue(key: keyof T) {
        return this._data[key];
    }

    setValue<K extends keyof T>(key: K, value: T[K]) {
        this._data[key] = value;
        this.data = this._data;
    }

    deleteValue(key: keyof T) {
        delete this._data[key];
        this.data = this._data;
    }
}

export const POWER_EAGLE_PATH = path.join(os.homedir(), ".powereagle");
export const POWER_EAGLE_PKGS_PATH = path.join(POWER_EAGLE_PATH, "pkgs");
export const POWER_EAGLE_BUCKETS_PATH = path.join(POWER_EAGLE_PATH, "buckets");
export const POWER_EAGLE_SHARED_NODE_MODULES = path.join(POWER_EAGLE_PKGS_PATH, "node_modules");

// Create required directories
[POWER_EAGLE_PATH, POWER_EAGLE_PKGS_PATH, POWER_EAGLE_BUCKETS_PATH, POWER_EAGLE_SHARED_NODE_MODULES].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Core packages that should always be available
const CORE_PACKAGES = [
    "@eagle-cooler/utils",
    "@eagle-cooler/util",
    "canvas"
] as const;

/**
 * Gets all shared dependencies from package.json
 */
export function getSharedDependencies(): { [key: string]: string } {
    try {
        const packageJsonPath = path.join(POWER_EAGLE_SHARED_NODE_MODULES, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
            return {};
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        return packageJson.dependencies || {};
    } catch (error) {
        console.error("[SharedDeps] Failed to read package.json:", error);
        return {};
    }
}

export const localLinksJson = new JsonFile<{
    [key: string]: string;
}>(path.join(POWER_EAGLE_PKGS_PATH, "localLinks.json"), {});


export function parseGitUrl(url: string): { user: string; repo: string } | null {
    // Handle both https and git URLs
    const match = url.match(/github\.com[:/]([^/]+)\/([^/]+)(?:\.git)?$/);
    if (!match) return null;

    const [, user, repo] = match;
    // Remove .git suffix if present
    const cleanRepo = repo.replace(/\.git$/, '');
    
    return {
        user,
        repo: cleanRepo
    };
}

export async function executeGitCommand(cwd: string, args: string[]): Promise<{ success: boolean; output: string }> {
    return new Promise((resolve) => {
        const git = childProcess.spawn("git", args, { cwd });
        let output = "";
        let error = "";

        git.stdout.on("data", (data: Buffer) => {
            output += data.toString();
        });

        git.stderr.on("data", (data: Buffer) => {
            error += data.toString();
        });

        git.on("close", (code: number) => {
            resolve({
                success: code === 0,
                output: output || error
            });
        });
    });
}

export async function cloneRepository(url: string, targetPath: string): Promise<boolean> {
    const result = await executeGitCommand(process.cwd(), ["clone", url, targetPath]);
    if (!result.success) {
        console.error(`Failed to clone repository ${url}:`, result.output);
    }
    return result.success;
}

export async function updateRepository(repoPath: string): Promise<boolean> {
    const result = await executeGitCommand(repoPath, ["pull"]);
    if (!result.success) {
        console.error(`Failed to update repository at ${repoPath}:`, result.output);
    }
    return result.success;
}

export async function isGitRepository(path: string): Promise<boolean> {
    const result = await executeGitCommand(path, ["status"]);
    return result.success;
}

// Helper function to update shared dependencies

/**
 * Compares two semantic version strings
 * @returns positive if v1 > v2, negative if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 !== num2) {
            return num1 - num2;
        }
    }
    return 0;
}

/**
 * Gets the higher of two semantic versions
 */
export function getHigherVersion(v1: string, v2: string): string {
    return compareVersions(v1, v2) > 0 ? v1 : v2;
} 

/**
 * Updates shared dependencies in package.json
 */
export function updateSharedDependencies(pkgName: string, dependencies: { [key: string]: string }): void {
    try {
        const packageJsonPath = path.join(POWER_EAGLE_SHARED_NODE_MODULES, "package.json");
        const packageJson = fs.existsSync(packageJsonPath)
            ? JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
            : { dependencies: {} };

        // Update dependencies with highest version
        Object.entries(dependencies).forEach(([dep, version]) => {
            if (!packageJson.dependencies[dep] || compareVersions(version, packageJson.dependencies[dep]) > 0) {
                packageJson.dependencies[dep] = version;
            }
        });

        // Ensure core packages are included
        CORE_PACKAGES.forEach(pkg => {
            if (!packageJson.dependencies[pkg]) {
                packageJson.dependencies[pkg] = "*";
            }
        });

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } catch (error) {
        console.error("[SharedDeps] Failed to update package.json:", error);
    }
}

/**
 * Installs npm packages to the shared node_modules directory
 */
export async function installSharedDependencies(dependencies: { [key: string]: string }): Promise<boolean> {
    try {
        const packageJsonPath = path.join(POWER_EAGLE_SHARED_NODE_MODULES, "package.json");
        
        // Skip if node_modules is up to date
        if (fs.existsSync(packageJsonPath)) {
            const packageJsonMtime = fs.statSync(packageJsonPath).mtime.getTime();
            const nodeModulesMtime = fs.statSync(POWER_EAGLE_SHARED_NODE_MODULES).mtime.getTime();
            if (Math.abs(packageJsonMtime - nodeModulesMtime) < 300000) { // 5 minutes
                return true;
            }
        }

        // Get the appropriate shell based on OS
        const shell = eagle.app.isWindows ? 'cmd.exe' : '/bin/sh';

        // Install dependencies
        for (const [pkg, version] of Object.entries(dependencies)) {
            try {
                const versionStr = version === '*' ? 'latest' : version;
                childProcess.execSync(`npm install ${pkg}@${versionStr}`, {
                    stdio: 'inherit',
                    cwd: POWER_EAGLE_SHARED_NODE_MODULES,
                    shell
                });
            } catch (error) {
                console.error(`[SharedDeps] Failed to install ${pkg}@${version}:`, error);
            }
        }

        return true;
    } catch (error) {
        console.error("[SharedDeps] Failed to install shared dependencies:", error);
        return false;
    }
}

// Initialize shared dependencies on module load
(async () => {
    try {
        const deps = getSharedDependencies();
        if (Object.keys(deps).length > 0) {
            await installSharedDependencies(deps);
        }
    } catch (error) {
        console.error("[SharedDeps] Failed to initialize shared dependencies:", error);
    }
})();

