import ModIPC from './modIpc';
import { IModLoader, IModRunner } from './i';
import { ModuleLoader } from './moduleLoader';
import { ModContext, defaultContext } from './modContext';

// Use existing modules if available (for browser bundlers) otherwise require them on Node.
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");

export interface V1Mod {
    name: string;
    render: () => string;
    mount: (container: HTMLElement, context?: ModContext) => Promise<void>;
    onLibraryChanged?: (newPath: string, oldPath: string) => void;
    onItemSelected?: (newItems: Item[], oldItems: Item[]) => void;
    onFolderSelected?: (newFolder: Folder | null, oldFolder: Folder | null) => void;
}

export type V1ModFactory = (context: ModContext) => V1Mod;

export class V1ModLoader implements IModLoader {
    private moduleLoader: ModuleLoader;

    constructor() {
        this.moduleLoader = new ModuleLoader();
    }

    private loadStyles(entryPath: string): void {
        const stylesPath = path.join(path.dirname(entryPath), "styles.css");
        if (fs.existsSync(stylesPath)) {
            const style = document.createElement("style");
            style.textContent = fs.readFileSync(stylesPath, "utf8");
            document.head.appendChild(style);
        }
    }

    async loadMod(entryPath: string, name = path.basename(path.dirname(entryPath)), context?: ModContext): Promise<IModRunner | null> {
        if (!fs.existsSync(entryPath)) {
            console.error(`[V1ModLoader] Entry path not found for ${name}: ${entryPath}`);
            return null;
        }

        let moduleExport: unknown;
        try {
            moduleExport = this.moduleLoader.loadModule(entryPath, context);
        } catch (err) {
            console.error(`[V1ModLoader] Failed to load module for ${name}:`, err);
            return null;
        }

        // Handle both direct mod exports and factory functions
        const mod = typeof moduleExport === 'function' 
            ? (moduleExport as V1ModFactory)(context || defaultContext)
            : moduleExport as V1Mod;

        try {
            this.loadStyles(entryPath);
            return new V1ModRunner(mod);
        } catch (err) {
            console.error(`[V1ModLoader] Failed to instantiate mod for ${name}:`, err);
            return null;
        }
    }
}

class V1ModRunner {
    private mod: V1Mod;
    private container: HTMLElement | null = null;
    private currentContext: ModContext | null = null;

    constructor(mod: V1Mod) {
        this.mod = mod;
    }

    async mount(container: HTMLElement, context?: ModContext) {
        this.container = container;
        this.currentContext = context || defaultContext;
        container.innerHTML = this.mod.render();
        await this.mod.mount(container, this.currentContext);

        // Register event handlers if they exist
        if (this.mod.onLibraryChanged || this.mod.onItemSelected || this.mod.onFolderSelected) {
            ModIPC.getInstance().registerHandlers({
                onLibraryChanged: this.mod.onLibraryChanged,
                onItemSelected: this.mod.onItemSelected,
                onFolderSelected: this.mod.onFolderSelected
            });
        }
    }

    setVisibility(visible: boolean) {
        if (this.container) {
            this.container.style.display = visible ? '' : 'none';
        }
    }

    unmount() {
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
        // Unregister event handlers
        console.log('Unmounting mod', this.mod.name);
        ModIPC.getInstance().unregisterHandlers();
    }

    getModName(): string {
        return this.mod.name;
    }
}

export default V1ModRunner;
