import ModBucket from "./bucket";
import ModPkg from "./pkg";
import {
  parseGitUrl,
  localLinksJson,
  POWER_EAGLE_BUCKETS_PATH,
  POWER_EAGLE_PKGS_PATH,
} from "./utils";
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");

class _ModMgr {
  buckets: Map<string, ModBucket> = new Map();
  pkgs: Map<string, ModPkg> = new Map();

  linkLocal(sourcePath : string){
    if (!fs.existsSync(sourcePath)) {
      return false;
    }
    const name = path.basename(sourcePath);
    localLinksJson.setValue(name, sourcePath);
    return true;
  }

  unlinkLocal(name : string){
    localLinksJson.deleteValue(name);
    return true;
  } 

  load() {
    // load the buckets
    for (const bucketPath of fs.readdirSync(POWER_EAGLE_BUCKETS_PATH)) {
      //if is folder
      if (
        !fs
          .statSync(path.join(POWER_EAGLE_BUCKETS_PATH, bucketPath))
          .isDirectory()
      ) {
        continue;
      }
      // folder not . or _
      if (bucketPath.startsWith(".") || bucketPath.startsWith("_")) {
        continue;
      }
      const bucket = ModBucket.loadBucket(bucketPath);
      this.buckets.set(bucket.folderName, bucket);
    }

    // load the pkgs
    for (const pkgPath of fs.readdirSync(POWER_EAGLE_PKGS_PATH)) {
      //if is folder
      if (
        !fs.statSync(path.join(POWER_EAGLE_PKGS_PATH, pkgPath)).isDirectory()
      ) {
        continue;
      }
      // folder not . or _
      if (pkgPath.startsWith(".") || pkgPath.startsWith("_")) {
        continue;
      }
      const pkg = ModPkg.loadPkg(pkgPath);
      this.pkgs.set(pkg.name, pkg);
    }
  }

  constructor() {
    this.load();
  }

  bucketExists(url: string) {
    const parsed = parseGitUrl(url);
    if (!parsed) {
      return false;
    }
    return fs.existsSync(path.join(POWER_EAGLE_BUCKETS_PATH, parsed.user + "_" + parsed.repo));
  }

  async addBucket(url: string): Promise<ModBucket | null> {
    if (this.bucketExists(url)) {
      return null;
    }
    const bucket = await ModBucket.addFromGitUrl(url);
    if (bucket) {
      this.buckets.set(bucket.folderName, bucket);
    }
    return bucket;
  }

  removeBucket(folderName: string): boolean {
    const bucket = this.buckets.get(folderName);
    if (!bucket) return false;
    const success = bucket.remove();
    if (success) {
      this.buckets.delete(folderName);
    }
    return success;
  }

  async updateBucket(folderName: string): Promise<boolean> {
    const bucket = this.buckets.get(folderName);
    if (!bucket) return false;
    return await bucket.update();
  }

  async updateAllBuckets(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    for (const [name, bucket] of this.buckets) {
      results.set(name, await bucket.update());
    }
    return results;
  }

  async installPkg(name: string, bucket?: ModBucket): Promise<ModPkg | null> {
    // If bucket is specified, install from that bucket
    if (bucket) {
      const pkg = await ModPkg.install(bucket, name);
      if (pkg) {
        this.pkgs.set(pkg.name, pkg);
      }
      return pkg;
    }

    // If no bucket specified, search all buckets
    for (const [, bucket] of this.buckets) {
      const pkg = await ModPkg.install(bucket, name);
      if (pkg) {
        this.pkgs.set(pkg.name, pkg);
        return pkg;
      }
    }

    return null;
  }

  uninstallPkg(name: string): boolean {
    const pkg = this.pkgs.get(name);
    if (!pkg) return false;
    const success = pkg.uninstall();
    if (success) {
      this.pkgs.delete(name);
    }
    return success;
  }

  async resetPkg(name: string, bucket: ModBucket): Promise<void> {
    const pkg = this.pkgs.get(name);
    if (!pkg) return;
    
    // Uninstall and reinstall
    pkg.uninstall();
    await this.installPkg(name, bucket);
  }

  async updatePkg(name: string, bucket: ModBucket): Promise<ModPkg | null> {
    const pkg = this.pkgs.get(name);
    if (!pkg) return null;
    
    // Uninstall and reinstall to get latest version
    pkg.uninstall();
    return await this.installPkg(name, bucket);
  }

  reset(): void {
    // Remove all buckets and packages
    for (const bucket of this.buckets.values()) {
      bucket.remove();
    }
    for (const pkg of this.pkgs.values()) {
      pkg.uninstall();
    }
    this.buckets.clear();
    this.pkgs.clear();
  }
}

const ModMgr = new _ModMgr();

export default ModMgr;