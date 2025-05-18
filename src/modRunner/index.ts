import ModPkg from "../modMgr/pkg";
import { POWER_EAGLE_PKGS_PATH } from "../modMgr/utils";
import V1ModRunner from "./v1";

// Use existing modules if available (for browser bundlers) otherwise require them on Node.
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");

export interface IModRunner {
  /**
   * Mount the mod into the given container element.
   */
  mount(container: HTMLElement): Promise<void>;
  /**
   * Unmount / dispose the mod.
   */
  unmount(): void;
  /**
   * Return the display name of the mod.
   */
  getModName(): string;
}

export type ModType = "v1" | "react" | "js";

/**
 * Internal helper: load a JS/TS module from disk using CommonJS require.
 */
function loadModule(entryPath: string): unknown {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(entryPath);
}

type V1Mod = {
  name: string;
  render: () => string;
  mount: (container: HTMLElement) => Promise<void>;
};

/**
 * Core factory that creates a runner given a concrete entry file path and type.
 */
export async function createModRunnerByPath(
  type: ModType,
  entryPath: string,
  name = path.basename(path.dirname(entryPath))
): Promise<IModRunner | null> {
  if (!fs.existsSync(entryPath)) {
    console.error(`[ModRunner] Entry path not found for ${name}: ${entryPath}`);
    return null;
  }

  let moduleExport: unknown;
  try {
    moduleExport = loadModule(entryPath);
  } catch (err) {
    console.error(`[ModRunner] Failed to load module for ${name}:`, err);
    return null;
  }

  switch (type) {
    case "v1": {
      const exported = (moduleExport as { default?: unknown }).default ?? moduleExport; // V1 mods typically default-export their object
      // if on the same folder, it has a styles.css file, apply it
      const stylesPath = path.join(path.dirname(entryPath), "styles.css");
      if (fs.existsSync(stylesPath)) {
        const style = document.createElement("style");
        style.textContent = fs.readFileSync(stylesPath, "utf8");
        document.head.appendChild(style);
      }

      try {
        return new V1ModRunner(exported as V1Mod);
      } catch (err) {
        console.error(`[ModRunner] Failed to instantiate V1ModRunner for ${name}:`, err);
        return null;
      }
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
export async function createModRunner(pkg: ModPkg): Promise<IModRunner | null> {
  const entryPath = path.join(POWER_EAGLE_PKGS_PATH, pkg.name, pkg.entryPoint);
  return createModRunnerByPath(pkg.type, entryPath, pkg.name);
}
