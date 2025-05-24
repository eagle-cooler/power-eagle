import ModPkg from "../modMgr/pkg";
import { POWER_EAGLE_PKGS_PATH } from "../modMgr/utils";
import { IModRunner } from "./i";
import V1Mod from "../modSpecs/v1";

// Use existing modules if available (for browser bundlers) otherwise require them on Node.
const path = (global as unknown as { path: typeof import("path") }).path || require("path");

export type ModType = "v1";

const modImpls = {
    v1: V1Mod
}

const modCreators: Record<ModType, (entryPath: string, name: string) => Promise<IModRunner | null>> = {
    v1: async (entryPath: string, name: string) => {
        const mod = new V1Mod();
        const success = await mod.loadMod(entryPath, name);
        return success ? mod : null;
    }
};

/**
 * Core factory that creates a runner given a concrete entry file path and type.
 */
export async function createModRunnerByPath(
    type: ModType,
    entryPath: string,
    name = path.basename(path.dirname(entryPath))
): Promise<IModRunner | null> {
    const creator = modCreators[type];
    if (!creator) {
        console.warn(`[ModRunner] Unknown mod type '${type}' for ${name}`);
        return null;
    }
    return creator(entryPath, name);
}

/**
 * Convenience wrapper for installed packages (retains backward-compatibility).
 */
export async function createModRunner(pkg: ModPkg): Promise<IModRunner | null> {
    const entryPath = path.join(POWER_EAGLE_PKGS_PATH, pkg.name, pkg.entryPoint);
    return createModRunnerByPath(pkg.type, entryPath, pkg.name);
}

/**
 * Get the type of a mod at the given path
 * @param path Path to check
 * @returns The mod class implementation or null if not a valid mod
 */
export async function getModType(modPath: string): Promise<typeof V1Mod | null> {
    // Check each mod type in order
    for (const [type, ModClass] of Object.entries(modImpls)) {
        if (!ModClass) {
            console.warn(`[ModRunner] ${type} mods are not supported yet`);
            continue;
        }
        if (await ModClass.isType(modPath)) {
            return ModClass;
        }
    }
    return null;
}

export type { IModRunner };

