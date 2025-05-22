import ModPkg from "../modMgr/pkg";
import { POWER_EAGLE_PKGS_PATH } from "../modMgr/utils";
import { IModRunner } from "./i";
import { V1ModLoader, ModContext } from "./v1";

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
  name = path.basename(path.dirname(entryPath)),
  context?: ModContext
): Promise<IModRunner | null> {
  switch (type) {
    case "v1": {
      const loader = new V1ModLoader();
      // Try index.js first, then fall back to main.js
      const indexPath = path.join(path.dirname(entryPath), "index.js");
      const mainPath = path.join(path.dirname(entryPath), "main.js");
      
      const mod = await loader.loadMod(
        fs.existsSync(indexPath) ? indexPath : mainPath,
        name,
        context
      );
      if (!mod) {
        return null;
      }
      return mod;
    }
    // TODO: react / js support
    default:
      console.warn(`[ModRunner] Unsupported mod type '${type}' for ${name}`);
      return null;
  }
}

/**
 * Convenience wrapper for installed packages (retains backward-compatibility).
 */
export async function createModRunner(pkg: ModPkg, context?: ModContext): Promise<IModRunner | null> {
  const entryPath = path.join(POWER_EAGLE_PKGS_PATH, pkg.name, pkg.entryPoint);
  return createModRunnerByPath(pkg.type, entryPath, pkg.name, context);
}
