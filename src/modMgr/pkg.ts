const path =
  (global as unknown as { path: typeof import("path") }).path ||
  require("path");
const fs =
  (global as unknown as { fs: typeof import("fs") }).fs || require("fs");
import {
  POWER_EAGLE_BUCKETS_PATH,
  POWER_EAGLE_PKGS_PATH,
  localLinksJson,
} from "./utils";
import ModBucket from "./bucket";
import { getModType, ModType } from "../modRunner";


class ModPkg {
  /**
   * a installed mod package
   */

  name: string;
  // choices: react, js
  type: ModType;
  version: string;
  entryPoint: string = "main.js";
  description: string;
  sourcePath?: string;

  constructor(options: {
    name: string;
    type: string;
    version: string;
    entryPoint?: string;
    description?: string;
    sourcePath?: string;
  }) {
    this.name = options.name;
    this.type = options.type as ModType;
    this.version = options.version;
    this.entryPoint = options.entryPoint || "main.js";
    this.description = options.description || "";
    this.sourcePath = options.sourcePath;
  }

  uninstall(): boolean {
    const pkgPath = path.join(POWER_EAGLE_PKGS_PATH, this.name);
    if (!fs.existsSync(pkgPath)) return false;

    try {
      // Get the mod type implementation
      const ModClass = getModType(pkgPath);
      if (ModClass) {
        // Run pre-uninstall hook if it exists
        if ('preUninstall' in ModClass) {
          (ModClass as { preUninstall: (path: string) => void }).preUninstall(pkgPath);
        }

        // Remove the package
        fs.rmSync(pkgPath, { recursive: true, force: true });

        // Run post-uninstall hook if it exists
        if ('postUninstall' in ModClass) {
          (ModClass as { postUninstall: (path: string) => void }).postUninstall(pkgPath);
        }
      } else {
        // If no implementation found, just remove the package
        fs.rmSync(pkgPath, { recursive: true, force: true });
      }
      return true;
    } catch (err) {
      console.error(`[ModPkg] Failed to uninstall ${this.name}:`, err);
      return false;
    }
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

  static loadPkg(name: string): ModPkg {
    const pkgPath = path.join(POWER_EAGLE_PKGS_PATH, name);
    if (!fs.existsSync(pkgPath)) {
      throw new Error(`Package ${name} not found`);
    }

    const modJsonPath = path.join(pkgPath, "mod.json");
    const sourcePath = localLinksJson.getValue(name);

    // Check if it's a v1 mod (no mod.json required)
    const hasJsFiles = fs
      .readdirSync(pkgPath)
      .some((file) => file.endsWith(".js"));
    if (!fs.existsSync(modJsonPath) && hasJsFiles) {
      // It's a v1 mod
      return new ModPkg({
        name,
        type: "v1",
        version: "1.0.0",
        entryPoint: fs.existsSync(path.join(pkgPath, "index.js"))
          ? "index.js"
          : "main.js",
        description: "",
        sourcePath,
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
      sourcePath,
    });
  }

  static async install(
    bucket: ModBucket,
    name: string
  ): Promise<ModPkg | null> {
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

    try {

      // Get the mod type implementation
      const ModClass = getModType(pkgPath);
      if (!ModClass) {
        throw new Error(`No implementation found for mod type ${name}`);
      }

      // Run pre-installation hook if it exists
      if ('preInstall' in ModClass) {
        (ModClass as { preInstall: (path: string) => void }).preInstall(targetPath);
      }

      // Copy package files
      fs.cpSync(pkgPath, targetPath, { recursive: true });

      // Run post-installation hook if it exists
      if ('postInstall' in ModClass) {
        (ModClass as { postInstall: (path: string) => void }).postInstall(targetPath);
      }

      // Load the installed package
      const pkg = ModPkg.loadPkg(name);
      return pkg;

    } catch (err) {
      console.error(`[ModPkg] Failed to install ${name}:`, err);
      // Clean up the installation if it fails
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
      return null;
    }
  }

  async versionDiff(bucket: ModBucket): Promise<number> {
    const manifest = bucket.getPkgManifest(this.name);
    if (!manifest) return 0;
    const bucketVersion = manifest.get("version");
    if (!bucketVersion) return 0;

    const versionParts = this.version.split(".").map(Number);
    const bucketVersionParts = bucketVersion.split(".").map(Number);

    for (
      let i = 0;
      i < Math.max(versionParts.length, bucketVersionParts.length);
      i++
    ) {
      const selfPart = versionParts[i] || 0;
      const bucketPart = bucketVersionParts[i] || 0;

      if (selfPart > bucketPart) return -1;
      if (selfPart < bucketPart) return 1;
    }

    return 0;
  }

  async update(
    bucket: ModBucket,
    forceInstall: boolean = false
  ): Promise<boolean> {
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
