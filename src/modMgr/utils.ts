// Use existing modules if available, otherwise import them
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const os = (global as unknown as { os: typeof import("os") }).os || require("os");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");
const { spawn } = (global as unknown as { spawn: typeof import("child_process") }).spawn || require("child_process");

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

if (!fs.existsSync(POWER_EAGLE_PKGS_PATH)) {
    fs.mkdirSync(POWER_EAGLE_PKGS_PATH, { recursive: true });
}

if (!fs.existsSync(POWER_EAGLE_BUCKETS_PATH)) {
    fs.mkdirSync(POWER_EAGLE_BUCKETS_PATH, { recursive: true });
}

export const localLinksJson = new JsonFile<{
    [key: string]: string;
}>(path.join(POWER_EAGLE_PKGS_PATH, "localLinks.json"), {});


export function parseGitUrl(url : string) : {
    user : string;
    repo: string;
} | null {
    const match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/);
    if (!match) {
        return null;
    }
    return {
        user : match[1],
        repo : match[2],
    };
}

export async function executeGitCommand(cwd: string, args: string[]): Promise<{ success: boolean; output: string }> {
    return new Promise((resolve) => {
        const git = spawn("git", args, { cwd });
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

