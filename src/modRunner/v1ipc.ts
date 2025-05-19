interface V1ModEventHandlers {
    onLibraryChanged?: (newPath: string, oldPath: string) => void;
    onItemSelected?: (newItems: Item[], oldItems: Item[]) => void;
    onFolderSelected?: (newFolder: Folder | null, oldFolder: Folder | null) => void;
}

class V1ModIPC {
    private static instance: V1ModIPC;
    private handlers: V1ModEventHandlers | null = null;
    private intervals: NodeJS.Timeout[] = [];

    private constructor() {
        this.setupListeners();
    }

    public static getInstance(): V1ModIPC {
        if (!V1ModIPC.instance) {
            V1ModIPC.instance = new V1ModIPC();
        }
        return V1ModIPC.instance;
    }

    private setupListeners() {
        if (typeof eagle !== 'undefined' && eagle.event) {
            // Library change events
            eagle.event.onLibraryChanged((path: string) => {
                if (this.handlers?.onLibraryChanged) {
                    this.handlers.onLibraryChanged(path, '');
                }
            });
        }

        // Item selection events
        const itemInterval = setInterval(async () => {
            if (typeof eagle !== 'undefined' && eagle.item) {
                const selectedItems = await eagle.item.getSelected();
                if (this.handlers?.onItemSelected) {
                    this.handlers.onItemSelected(selectedItems, []);
                }
            }
        }, 1000);
        this.intervals.push(itemInterval);

        // Folder selection events
        const folderInterval = setInterval(async () => {
            if (typeof eagle !== 'undefined' && eagle.folder) {
                const selectedFolders = await eagle.folder.getSelected();
                const currentFolder = selectedFolders[0] || null;
                if (this.handlers?.onFolderSelected) {
                    this.handlers.onFolderSelected(currentFolder, null);
                }
            }
        }, 1000);
        this.intervals.push(folderInterval);
    }

    public registerHandlers(handlers: V1ModEventHandlers) {
        this.handlers = handlers;
    }

    public unregisterHandlers() {
        this.handlers = null;
    }

    public cleanup() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        this.handlers = null;
    }
}

export default V1ModIPC; 