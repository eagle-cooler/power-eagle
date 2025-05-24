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
     * 3. v1 - legacy mod type
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
                .filter(file => fs.statSync(path.join(bucketPath, file)).isDirectory())
                .filter(file => file !== "node_modules");

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
        const modsJsonPath = path.join(bucketPath, "mods.json");
        const hasModsJson = fs.existsSync(modsJsonPath);
        const type = hasModsJson ? "bucket" : "package";
        
        let pkgs: string[] = [];
        if (type === "bucket") {
            // Load packages from mods.json
            try {
                const modsJson = JSON.parse(fs.readFileSync(modsJsonPath, "utf8"));
                if (Array.isArray(modsJson)) {
                    // Handle both string entries and object entries with remote links
                    pkgs = modsJson.map(entry => {
                        if (typeof entry === 'string') {
                            return entry;
                        } else if (typeof entry === 'object' && entry !== null) {
                            // Handle remote link format: { name: string, remote: string }
                            if ('name' in entry && 'remote' in entry) {
                                return entry.name;
                            }
                        }
                        return null;
                    }).filter((pkg): pkg is string => pkg !== null && pkg !== "node_modules");
                } else {
                    console.error(`Invalid mods.json format in ${folderName}: expected array`);
                    return new ModBucket({
                        type: "bucket",
                        pkgs: [],
                        folderName
                    });
                }
            } catch (error) {
                console.error(`Failed to parse mods.json in ${folderName}:`, error);
                return new ModBucket({
                    type: "bucket",
                    pkgs: [],
                    folderName
                });
            }
        } else {
            // For package type, just use the folder name
            pkgs = [folderName];
        }

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

        // For bucket type, search through packages listed in mods.json
        for (const pkgName of this.pkgs) {
            if (pkgName === name || pkgName.includes(name)) {
                try {
                    const pkgPath = path.join(POWER_EAGLE_BUCKETS_PATH, this.folderName, pkgName);
                    if (!fs.existsSync(pkgPath)) {
                        console.warn(`Package ${pkgName} listed in mods.json but not found in bucket`);
                        continue;
                    }

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
                    } else {
                        console.warn(`Package ${pkgName} in mods.json is neither a v1 mod nor has mod.json`);
                    }
                } catch (error) {
                    console.error(`Failed to load package ${pkgName}:`, error);
                }
            }
        }

        return only1 ? null : results;
    }

    getRemoteLink(pkgName: string): string | null {
        if (this.type !== "bucket") return null;

        try {
            const modsJsonPath = path.join(POWER_EAGLE_BUCKETS_PATH, this.folderName, "mods.json");
            if (!fs.existsSync(modsJsonPath)) return null;

            const modsJson = JSON.parse(fs.readFileSync(modsJsonPath, "utf8"));
            if (!Array.isArray(modsJson)) return null;

            const entry = modsJson.find(entry => {
                if (typeof entry === 'string') {
                    return entry === pkgName;
                } else if (typeof entry === 'object' && entry !== null) {
                    return 'name' in entry && entry.name === pkgName;
                }
                return false;
            });

            if (entry && typeof entry === 'object' && 'remote' in entry) {
                return entry.remote;
            }
            return null;
        } catch (error) {
            console.error(`Failed to get remote link for ${pkgName}:`, error);
            return null;
        }
    }
}

export default ModBucket;