import { IModRunner, ModContext, defaultContext, ModIPC } from '../modRunner/i';
import { loadModule } from '../modRunner/utils';

// Use existing modules if available (for browser bundlers) otherwise require them on Node.
const path = (global as unknown as { path: typeof import("path") }).path || require("path");
const fs = (global as unknown as { fs: typeof import("fs") }).fs || require("fs");

export interface V1ModDefinition {
    name: string;
    render: () => string;
    mount: (container: HTMLElement, context?: ModContext) => Promise<void>;
    onLibraryChanged?: (newPath: string, oldPath: string) => void;
    onItemSelected?: (newItems: Item[], oldItems: Item[]) => void;
    onFolderSelected?: (newFolder: Folder | null, oldFolder: Folder | null) => void;
}

export type V1ModFactory = (context: ModContext) => V1ModDefinition;

export class V1Mod implements IModRunner {
    private mod!: V1ModDefinition;
    private container: HTMLElement | null = null;
    private currentContext: ModContext | null = null;

    private loadStyles(entryPath: string): void {
        const stylesPath = path.join(path.dirname(entryPath), "styles.css");
        if (fs.existsSync(stylesPath)) {
            const style = document.createElement("style");
            style.textContent = fs.readFileSync(stylesPath, "utf8");
            document.head.appendChild(style);
        }
    }

    private validateModStructure(entryPath: string, name: string): boolean {
        const modDir = path.dirname(entryPath);
        const hasModJson = fs.existsSync(path.join(modDir, "mod.json"));
        const hasJsFiles = fs.readdirSync(modDir).some(file => file.endsWith(".js"));

        if (hasModJson || !hasJsFiles) {
            console.error(`[V1Mod] Invalid v1 mod structure for ${name}: mod.json should not exist and at least one .js file is required`);
            return false;
        }
        return true;
    }

    private findEntryPoint(modDir: string): string | null {
        const indexPath = path.join(modDir, "index.js");
        const mainPath = path.join(modDir, "main.js");
        
        if (fs.existsSync(indexPath)) return indexPath;
        if (fs.existsSync(mainPath)) return mainPath;
        return null;
    }

    prepareContext(baseContext?: ModContext): ModContext {
        const base = baseContext || defaultContext;
        return {
            ...base,
            powerEagle: {
                ...base.powerEagle,
                api: {
                    ...base.powerEagle.api,
                    // Add V1-specific API methods here
                }
            }
        };
    }

    async loadMod(entryPath: string, name = path.basename(path.dirname(entryPath)), context?: ModContext): Promise<boolean> {
        // If entryPath is a directory, find the entry point
        if (fs.statSync(entryPath).isDirectory()) {
            const foundEntry = this.findEntryPoint(entryPath);
            if (!foundEntry) {
                console.error(`[V1Mod] No entry point found for ${name} in ${entryPath}`);
                return false;
            }
            entryPath = foundEntry;
        }

        if (!fs.existsSync(entryPath)) {
            console.error(`[V1Mod] Entry path not found for ${name}: ${entryPath}`);
            return false;
        }

        if (!this.validateModStructure(entryPath, name)) {
            return false;
        }

        let moduleExport: unknown;
        try {
            const preparedContext = this.prepareContext(context);
            moduleExport = loadModule(entryPath, preparedContext);
        } catch (err) {
            console.error(`[V1Mod] Failed to load module for ${name}:`, err);
            return false;
        }

        // Handle both direct mod exports and factory functions
        this.mod = typeof moduleExport === 'function' 
            ? (moduleExport as V1ModFactory)(this.prepareContext(context))
            : moduleExport as V1ModDefinition;

        try {
            this.loadStyles(entryPath);
            return true;
        } catch (err) {
            console.error(`[V1Mod] Failed to instantiate mod for ${name}:`, err);
            return false;
        }
    }

    async mount(container: HTMLElement, context?: ModContext) {
        this.container = container;
        this.currentContext = this.prepareContext(context);
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

export default V1Mod;
