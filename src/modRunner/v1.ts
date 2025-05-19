import V1ModIPC from './v1ipc';

interface V1Mod {
    name: string;
    render: () => string;
    mount: (container: HTMLElement) => Promise<void>;
    onLibraryChanged?: (newPath: string, oldPath: string) => void;
    onItemSelected?: (newItems: Item[], oldItems: Item[]) => void;
    onFolderSelected?: (newFolder: Folder | null, oldFolder: Folder | null) => void;
}

class V1ModRunner {
    private mod: V1Mod;
    private container: HTMLElement | null = null;
    private ipc: V1ModIPC;
    private isVisible: boolean = true;

    constructor(mod: V1Mod) {
        this.mod = mod;
        this.ipc = V1ModIPC.getInstance();
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
        this.isVisible = visible;
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
