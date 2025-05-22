export interface ModContext {
    powerEagle: {
        version: string;
        api: {
            log: (message: string) => void;
            // ... other API methods
        };
    };
    [key: string]: unknown;
}

export const defaultContext: ModContext = {
    powerEagle: {
        version: "1.0.0",
        api: {
            log: (message: string) => console.log(`[PowerEagle] ${message}`),
        }
    }
};

/**
 * Interface for mod runner implementations.
 * 
 * Required static methods (must be implemented on the class):
 * - isType(path: string): Promise<boolean> - Check if a path contains a valid mod of this type
 * 
 * Optional static lifecycle methods:
 * - preInstall(path: string): void
 * - postInstall(path: string): void
 * - preUninstall(path: string): void
 * - postUninstall(path: string): void
 */
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
    /**
     * Load a mod from a given entry path
     * @param entryPath The path to the mod's entry file
     * @param name Optional name override for the mod
     * @returns Whether the mod was loaded successfully
     */
    loadMod(entryPath: string, name?: string): Promise<boolean>;
    /**
     * Prepare the context for the mod
     * @param baseContext The base context to extend
     * @returns The prepared context for the mod
     */
    prepareContext(baseContext?: ModContext): ModContext;
}

// SECTION IPC

interface ModEventHandlers {
  onLibraryChanged?: (newPath: string, oldPath: string) => void;
  onItemSelected?: (newItems: Item[], oldItems: Item[]) => void;
  onFolderSelected?: (newFolder: Folder | null, oldFolder: Folder | null) => void;
}

export class ModIPC {
  private static instance: ModIPC;
  private handlers: ModEventHandlers | null = null;
  private intervals: NodeJS.Timeout[] = [];

  private constructor() {
      this.setupListeners();
  }

  public static getInstance(): ModIPC {
      if (!ModIPC.instance) {
          ModIPC.instance = new ModIPC();
      }
      return ModIPC.instance;
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

  public registerHandlers(handlers: ModEventHandlers) {
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

