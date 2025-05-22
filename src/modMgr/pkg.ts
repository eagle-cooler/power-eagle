const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");
import { POWER_EAGLE_BUCKETS_PATH, POWER_EAGLE_PKGS_PATH, localLinksJson } from "./utils";
import ModBucket from "./bucket";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const execSync = (global as unknown as { execSync: typeof import("child_process").execSync }).execSync || require("child_process").execSync;

class ModPkg {
    /**
     * a installed mod package
     */

    name : string;
    // choices: react, js
    type : "react" | "js" | "v1";
    version : string;
    entryPoint : string = "main.js";
    description: string;
    sourcePath?: string;

    constructor(options : {
        name : string;
        type : string;
        version : string;
        entryPoint? : string;
        description?: string;
        sourcePath?: string;
    }){
        this.name = options.name;
        this.type = options.type as "react" | "js" | "v1";
        this.version = options.version;
        this.entryPoint = options.entryPoint || "main.js";
        this.description = options.description || "";
        this.sourcePath = options.sourcePath;
    }

    uninstall(): boolean {
        const pkgPath = path.join(POWER_EAGLE_PKGS_PATH, this.name);
        if (!fs.existsSync(pkgPath)) return false;
        fs.rmSync(pkgPath, { recursive: true, force: true });
        return true;
    }

    link(sourcePath: string): boolean {
        if (!fs.existsSync(sourcePath)) return false;
        this.sourcePath = sourcePath;
        localLinksJson.setValue(this.name, sourcePath);
        return true;
    }

    unlink(): boolean {
        if (!this.sourcePath) return false;
        localLinksJson.setValue(this.name, "");
        this.sourcePath = undefined;
        return true;
    }

    static loadPkg(name : string) : ModPkg {
        const pkgPath = path.join(POWER_EAGLE_PKGS_PATH, name);
        if (!fs.existsSync(pkgPath)) {
            throw new Error(`Package ${name} not found`);
        }

        const modJsonPath = path.join(pkgPath, "mod.json");
        const sourcePath = localLinksJson.getValue(name);

        // Check if it's a v1 mod (no mod.json required)
        const hasJsFiles = fs.readdirSync(pkgPath).some(file => file.endsWith(".js"));
        if (!fs.existsSync(modJsonPath) && hasJsFiles) {
            // It's a v1 mod
            return new ModPkg({
                name,
                type: "v1",
                version: "1.0.0",
                entryPoint: fs.existsSync(path.join(pkgPath, "index.js")) ? "index.js" : "main.js",
                description: "",
                sourcePath
            });
        }

        // For other mod types, require mod.json
        if (!fs.existsSync(modJsonPath)) {
            throw new Error(`Package ${name} is missing mod.json`);
        }

        const modJson = JSON.parse(fs.readFileSync(modJsonPath, "utf8"));
        return new ModPkg({
            name,
            type: modJson.type,
            version: modJson.version,
            entryPoint: modJson.entryPoint,
            description: modJson.description,
            sourcePath
        });
    }

    private async installRequirements(): Promise<void> {
        const reqPath = path.join(POWER_EAGLE_PKGS_PATH, this.name, "req.txt");
        if (!fs.existsSync(reqPath)) {
            return;
        }
        console.log('[ModPkg] Installing requirements for', this.name);

        const requirements = fs.readFileSync(reqPath, 'utf8').split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));

        if (requirements.length === 0) {
            return;
        }

        const pkgDir = path.join(POWER_EAGLE_PKGS_PATH, this.name);
        console.log(`[ModPkg] Installing requirements for ${this.name} in directory: ${pkgDir}`);
        
        try {
            // Install npm packages
            for (const req of requirements) {
                console.log(`[ModPkg] Installing ${req} in ${pkgDir}`);
                execSync(`npm install ${req}`, { 
                    stdio: 'inherit',
                    cwd: pkgDir
                });
            }
        } catch (err) {
            console.error(`[ModPkg] Failed to install requirements in ${pkgDir}:`, err);
            throw err;
        }
    }

    static async install(bucket: ModBucket, name: string): Promise<ModPkg | null> {
        const bucketPath = path.join(POWER_EAGLE_BUCKETS_PATH, bucket.folderName);
        const pkgPath = path.join(bucketPath, name);
        const targetPath = path.join(POWER_EAGLE_PKGS_PATH, name);

        // Check if package exists in bucket
        if (!fs.existsSync(pkgPath)) {
            return null;
        }

        // Check if package is already installed
        if (fs.existsSync(targetPath)) {
            return null;
        }

        // Copy package files
        fs.cpSync(pkgPath, targetPath, { recursive: true });

        // Load the installed package
        const pkg = ModPkg.loadPkg(name);
        
        try {
            // Install requirements after copying files
            await pkg.installRequirements();
        } catch (err) {
            console.error(`[ModPkg] Failed to install requirements for ${name}:`, err);
            // Clean up the installation if requirements fail
            fs.rmSync(targetPath, { recursive: true, force: true });
            return null;
        }

        return pkg;
    }

    async versionDiff(bucket: ModBucket): Promise<number> {
        const manifest = bucket.getPkgManifest(this.name);
        if (!manifest) return 0;
        const bucketVersion = manifest.get("version");
        if (!bucketVersion) return 0;   
        
        const versionParts = this.version.split(".").map(Number);
        const bucketVersionParts = bucketVersion.split(".").map(Number);
        
        for (let i = 0; i < Math.max(versionParts.length, bucketVersionParts.length); i++) {
            const selfPart = versionParts[i] || 0;
            const bucketPart = bucketVersionParts[i] || 0;
            
            if (selfPart > bucketPart) return -1;
            if (selfPart < bucketPart) return 1;
        }
        
        return 0;
    }

    async update(bucket: ModBucket, forceInstall: boolean = false): Promise<boolean> {
        const bucketPath = path.join(POWER_EAGLE_BUCKETS_PATH, bucket.folderName);
        const pkgPath = path.join(bucketPath, this.name);
        const targetPath = path.join(POWER_EAGLE_PKGS_PATH, this.name);

        // Check if package exists in bucket
        if (!fs.existsSync(pkgPath)) {
            return false;
        }

        // Check if package is installed
        if (!fs.existsSync(targetPath)) {
            return false;
        }

        // check if bucket is newer
        const versionDiff = await this.versionDiff(bucket);
        if (versionDiff === 0) {
            return false;
        }
        if (versionDiff === -1 && !forceInstall) {
            return false;
        }

        // Copy updated files from bucket
        fs.cpSync(pkgPath, targetPath, { recursive: true });

        // Reload package data
        const updatedPkg = ModPkg.loadPkg(this.name);
        this.type = updatedPkg.type;
        this.version = updatedPkg.version;
        this.entryPoint = updatedPkg.entryPoint;
        this.description = updatedPkg.description;

        return true;
    }

    isLegacy(): boolean {
        return this.type === "v1";
    }
}

export default ModPkg;