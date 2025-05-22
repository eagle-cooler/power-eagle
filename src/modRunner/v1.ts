import ModIPC from './modIpc';
import { IModLoader, IModRunner } from './i';
import { ModuleLoader, ModContext } from './moduleLoader';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const execSync = (global as unknown as { execSync: typeof import("child_process").execSync }).execSync || require("child_process").execSync;

// Use existing modules if available (for browser bundlers) otherwise require them on Node.
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");

export interface V1Mod {
    name: string;
    render: () => string;
    mount: (container: HTMLElement) => Promise<void>;
    onLibraryChanged?: (newPath: string, oldPath: string) => void;
    onItemSelected?: (newItems: Item[], oldItems: Item[]) => void;
    onFolderSelected?: (newFolder: Folder | null, oldFolder: Folder | null) => void;
}

export class V1ModLoader implements IModLoader {
    private moduleLoader: ModuleLoader;

    constructor() {
        this.moduleLoader = new ModuleLoader();
    }

    private async installRequirements(modPath: string): Promise<void> {
        const reqPath = path.join(path.dirname(modPath), "req.txt");
        if (!fs.existsSync(reqPath)) {
            return;
        }

        const requirements = fs.readFileSync(reqPath, 'utf8').split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));

        if (requirements.length === 0) {
            return;
        }

        console.log(`[V1ModLoader] Installing requirements for ${path.basename(path.dirname(modPath))}`);
        
        try {
    
            // Install npm packages
            for (const req of requirements) {
                execSync(`npm install ${req}`, { stdio: 'inherit' });
            }
        } catch (err) {
            console.error(`[V1ModLoader] Failed to install requirements:`, err);
            throw err;
        }
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

        try {
            // Install requirements before loading the module
            await this.installRequirements(entryPath);
        } catch (err) {
            console.error(`[V1ModLoader] Failed to install requirements for ${name}:`, err);
            return null;
        }

        let moduleExport: unknown;
        try {
            moduleExport = this.moduleLoader.loadModule(entryPath, context);
        } catch (err) {
            console.error(`[V1ModLoader] Failed to load module for ${name}:`, err);
            return null;
        }

        const exported = (moduleExport as { default?: unknown }).default ?? moduleExport;
        try {
            this.loadStyles(entryPath);
            return new V1ModRunner(exported as V1Mod);
        } catch (err) {
            console.error(`[V1ModLoader] Failed to instantiate mod for ${name}:`, err);
            return null;
        }
    }
}

class V1ModRunner {
    private mod: V1Mod;
    private container: HTMLElement | null = null;
    private ipc: ModIPC;

    constructor(mod: V1Mod) {
        this.mod = mod;
        this.ipc = ModIPC.getInstance();
    }

    async mount(container: HTMLElement) {
        this.container = container;
        container.innerHTML = this.mod.render();
        await this.mod.mount(container);

        // Register event handlers if they exist
        if (this.mod.onLibraryChanged || this.mod.onItemSelected || this.mod.onFolderSelected) {
            this.ipc.registerHandlers({
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
        this.ipc.unregisterHandlers();
    }

    getModName(): string {
        return this.mod.name;
    }
}

export default V1ModRunner;
