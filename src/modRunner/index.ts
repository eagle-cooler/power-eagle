import ModPkg from "../modMgr/pkg";
import { POWER_EAGLE_PKGS_PATH } from "../modMgr/utils";
import { IModRunner } from "./i";
import { V1ModLoader } from "./v1";

// Use existing modules if available (for browser bundlers) otherwise require them on Node.
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");

export type ModType = "v1" | "react" | "js";

/**
 * Core factory that creates a runner given a concrete entry file path and type.
 */
export async function createModRunnerByPath(
  type: ModType,
  entryPath: string,
  name = path.basename(path.dirname(entryPath))
): Promise<IModRunner | null> {
  switch (type) {
    case "v1": {
      // For v1 mods, check if it's a valid v1 mod structure
      const modDir = path.dirname(entryPath);
      const hasModJson = fs.existsSync(path.join(modDir, "mod.json"));
      const hasJsFiles = fs.readdirSync(modDir).some(file => file.endsWith(".js"));

      // V1 mods should not have mod.json and should have at least one js file
      if (hasModJson || !hasJsFiles) {
        console.error(`[ModRunner] Invalid v1 mod structure for ${name}: mod.json should not exist and at least one .js file is required`);
        return null;
      }

      const loader = new V1ModLoader();
      // Try index.js first, then fall back to main.js
      const indexPath = path.join(modDir, "index.js");
      const mainPath = path.join(modDir, "main.js");
      
      const mod = await loader.loadMod(
        fs.existsSync(indexPath) ? indexPath : mainPath,
        name
      );
      if (!mod) {
        return null;
      }
      return mod;
    }
    case "react":
    case "js":
      console.warn(`[ModRunner] Mod type '${type}' is not supported yet for ${name}`);
      return null;
    default:
      console.warn(`[ModRunner] Unknown mod type '${type}' for ${name}`);
      return null;
  }
}

/**
 * Convenience wrapper for installed packages (retains backward-compatibility).
 */
export async function createModRunner(pkg: ModPkg): Promise<IModRunner | null> {
  const entryPath = path.join(POWER_EAGLE_PKGS_PATH, pkg.name, pkg.entryPoint);
  return createModRunnerByPath(pkg.type, entryPath, pkg.name);
}
export type { IModRunner };

