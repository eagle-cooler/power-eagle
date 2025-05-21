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

export interface IModLoader {
    /**
     * Load a mod from a given entry path
     * @param entryPath The path to the mod's entry file
     * @param name Optional name override for the mod
     * @returns The loaded mod or null if loading failed
     */
    loadMod(entryPath: string, name?: string): Promise<IModRunner | null>;
} 