const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");
import { POWER_EAGLE_BUCKETS_PATH, parseGitUrl, cloneRepository, updateRepository, isGitRepository } from "./utils";
import ModPkg from "./pkg";

class ModBucket {
    /**
     * a bucket is a collection index of mods
     * 
     * there are 2 bucket types
     * essentially git repos
     * 1. bucket - multiple packages forming a bucket
     * bucket
     * |-- mods.json (list of packages in the bucket as an array, can contain remote types)
     * |-- pkg1 (source files)
     * |-- pkg2 (ready to use files)   
     * 
     * 2. package - single package type
     * package
     * |-- * (pkg content)
     * |-- mod.json (package definition)
     * 
     */
    type : "bucket" | "package";
    pkgs : string[];
    folderName : string;
    gitUrl?: string;
    // folderName == {gituser}_{gitrepo}
    constructor(options : {
        type : "bucket" | "package";
        pkgs : string[];
        folderName : string;
        gitUrl?: string;
    }){
        this.type = options.type;
        this.pkgs = options.pkgs;
        this.folderName = options.folderName;
        this.gitUrl = options.gitUrl;
    }

    async update(): Promise<boolean> {
        if (!this.gitUrl) return false;
        const bucketPath = path.join(POWER_EAGLE_BUCKETS_PATH, this.folderName);
        if (!await isGitRepository(bucketPath)) return false;
        return await updateRepository(bucketPath);
    }
    
    remove(): boolean {
        const bucketPath = path.join(POWER_EAGLE_BUCKETS_PATH, this.folderName);
        if (!fs.existsSync(bucketPath)) return false;
        fs.rmSync(bucketPath, { recursive: true, force: true });
        return true;
    }

    static async addFromGitUrl(url : string): Promise<ModBucket | null> {
        const parsed = parseGitUrl(url);
        if (!parsed) return null;

        const folderName = `${parsed.user}_${parsed.repo}`;
        const bucketPath = path.join(POWER_EAGLE_BUCKETS_PATH, folderName);

        // Check for duplicates
        if (fs.existsSync(bucketPath)) {
            return null;
        }

        // Clone the repository
        const success = await cloneRepository(url, bucketPath);
        if (!success) return null;

        // Determine bucket type and load packages
        const isPackage = fs.existsSync(path.join(bucketPath, "mod.json"));
        const type = isPackage ? "package" : "bucket";
        const pkgs = isPackage ? [folderName] : 
            fs.readdirSync(bucketPath)
                .filter(file => !file.startsWith(".") && !file.startsWith("_"))
                .filter(file => fs.statSync(path.join(bucketPath, file)).isDirectory());

        return new ModBucket({
            type,
            pkgs,
            folderName,
            gitUrl: url
        });
    }

    static loadBucket(folderName : string) : ModBucket {
        const bucketPath = path.join(POWER_EAGLE_BUCKETS_PATH, folderName);
        if (!fs.existsSync(bucketPath)) {
            throw new Error(`Bucket ${folderName} not found`);
        }

        // Check for mods.json to determine if it's a bucket
        const hasModsJson = fs.existsSync(path.join(bucketPath, "mods.json"));
        const type = hasModsJson ? "bucket" : "package";
        const pkgs = type === "package" ? [folderName] : 
            fs.readdirSync(bucketPath)
                .filter(file => !file.startsWith(".") && !file.startsWith("_"))
                .filter(file => fs.statSync(path.join(bucketPath, file)).isDirectory());

        // Try to get git URL from .git/config
        let gitUrl: string | undefined;
        try {
            const configPath = path.join(bucketPath, ".git", "config");
            if (fs.existsSync(configPath)) {
                const config = fs.readFileSync(configPath, "utf8");
                const urlMatch = config.match(/url\s*=\s*(.+)/);
                if (urlMatch) {
                    gitUrl = urlMatch[1].trim();
                }
            }
        } catch (error) {
            console.error(`Failed to read git config for ${folderName}:`, error);
        }

        return new ModBucket({
            type,
            pkgs,
            folderName,
            gitUrl
        });
    }

    getPkgManifest(pkgName : string) : Map<string, string> {
        const pkgPath = path.join(POWER_EAGLE_BUCKETS_PATH, this.folderName, pkgName);
        if (!fs.existsSync(pkgPath)) {
            throw new Error(`Package ${pkgName} not found`);
        }
        const manifest = new Map<string, string>();
        if (this.type === "bucket") {
            const modJsonPath = path.join(pkgPath, "mod.json");
            if (fs.existsSync(modJsonPath)) {
                const modJson = JSON.parse(fs.readFileSync(modJsonPath, "utf8"));
                manifest.set("type", modJson.type);
                manifest.set("version", modJson.version);
            }
        } else {
            // package
            const modJsonPath = path.join(pkgPath, "mod.json");
            if (fs.existsSync(modJsonPath)) {
                const modJson = JSON.parse(fs.readFileSync(modJsonPath, "utf8"));
                manifest.set("type", modJson.type);
                manifest.set("version", modJson.version);
            }
        }
        return manifest;
    }

    getBucketPkg(name: string, only1: boolean = false): ModPkg | ModPkg[] | null {
        const results: ModPkg[] = [];

        if (this.type === "package") {
            // If this is a package bucket, check if it matches the name
            if (this.folderName === name) {
                const pkg = ModPkg.loadPkg(name);
                return only1 ? pkg : [pkg];
            }
            return only1 ? null : [];
        }

        // For bucket type, search through all packages
        for (const pkgName of this.pkgs) {
            if (pkgName === name || pkgName.includes(name)) {
                try {
                    const pkgPath = path.join(POWER_EAGLE_BUCKETS_PATH, this.folderName, pkgName);
                    if (!fs.existsSync(pkgPath)) continue;

                    // Check if it's a v1 mod (has .js files but no mod.json)
                    const hasJsFiles = fs.readdirSync(pkgPath).some(file => file.endsWith('.js'));
                    const hasModJson = fs.existsSync(path.join(pkgPath, 'mod.json'));
                    
                    if (hasJsFiles && !hasModJson) {
                        // Create a v1 mod package
                        const pkg = new ModPkg({
                            name: pkgName,
                            type: "v1",
                            version: "1.0.0",
                            sourcePath: pkgPath
                        });
                        if (only1) return pkg;
                        results.push(pkg);
                    } else if (hasModJson) {
                        // Load regular package with mod.json
                        const pkg = ModPkg.loadPkg(pkgName);
                        if (only1) return pkg;
                        results.push(pkg);
                    }
                } catch (error) {
                    console.error(`Failed to load package ${pkgName}:`, error);
                }
            }
        }

        return only1 ? null : results;
    }
}

export default ModBucket;