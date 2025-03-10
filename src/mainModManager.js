const fs = require('fs');
const { execSync } = require('child_process');

/**
 * @typedef {Object} EagleEventHandlers
 * @property {function(Array<Object>, Array<Object>)=} onItemSelected - Optional handler for item selection changes (newItems, oldItems)
 * @property {function(Object, Object)=} onFolderSelected - Optional handler for folder selection changes (newFolder, oldFolder)
 * @property {function(string, string)=} onLibraryChanged - Optional handler for library path changes (newPath, oldPath)
 */

/**
 * @typedef {Object} EagleMod
 * @property {string} name - The display name of the mod
 * @property {function(): string=} render - Optional function that returns the HTML content
 * @property {function(HTMLElement): (function|void)=} mount - Optional function called after rendering
 * @property {Array<string>=} styles - Optional array of CSS file paths
 * @property {...EagleEventHandlers} - Optional event handlers
 */

class ModManager {
    constructor() {
        if (ModManager.instance) {
            return ModManager.instance;
        }
        
        this.modCache = new Map();
        this.state = {
            selectedItems: [],
            selectedFolder: null,
            libraryPath: ''
        };
        this.activeMods = new Set();
        
        // Set up polling interval
        this.pollingInterval = setInterval(async () => {
            try {
                // Handle folder selection
                const selectedFolders = await eagle.folder.getSelected();
                const newFolder = selectedFolders?.[0] || null;
                
                // Check for folder changes - only if there's an actual change
                const folderChanged = 
                    // Case 1: One is null and the other isn't
                    (this.state.selectedFolder === null && newFolder !== null) ||
                    (this.state.selectedFolder !== null && newFolder === null) ||
                    // Case 2: Both exist but have different IDs
                    (this.state.selectedFolder?.id !== newFolder?.id);
                
                if (folderChanged) {
                    const oldFolder = this.state.selectedFolder;
                    this.state.selectedFolder = newFolder;
                    
                    console.log('Folder changed:', {
                        old: oldFolder ? { id: oldFolder.id, name: oldFolder.name } : null,
                        new: newFolder ? { id: newFolder.id, name: newFolder.name } : null
                    });
                    
                    // Notify active mods of folder change
                    if (this.loadedMods) {
                        this.loadedMods.forEach(mod => {
                            if (!this.activeMods.has(mod.folder)) return;
                            if (mod.onFolderSelected) {
                                mod.onFolderSelected(newFolder, oldFolder);
                            }
                        });
                    }
                }

                // Handle item selection separately
                const newItems = await eagle.item.getSelected();
                const itemsChanged = !this._areItemArraysEqual(newItems, this.state.selectedItems);
                if (itemsChanged) {
                    const oldItems = this.state.selectedItems;
                    this.state.selectedItems = newItems;
                    
                    // Notify active mods of item selection change
                    if (this.loadedMods) {
                        this.loadedMods.forEach(mod => {
                            if (!this.activeMods.has(mod.folder)) return;
                            if (mod.onItemSelected) {
                                mod.onItemSelected(newItems, oldItems);
                            }
                        });
                    }
                }

                // Handle library path changes
                const newLibraryPath = eagle.library.path;
                if (newLibraryPath !== this.state.libraryPath) {
                    const oldPath = this.state.libraryPath;
                    this.state.libraryPath = newLibraryPath;
                    
                    // Notify active mods of library change
                    if (this.loadedMods) {
                        this.loadedMods.forEach(mod => {
                            if (!this.activeMods.has(mod.folder)) return;
                            if (mod.onLibraryChanged) {
                                mod.onLibraryChanged(newLibraryPath, oldPath);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error in event polling:', error);
            }
        }, 100);

        // Set up library change handler
        eagle.onLibraryChanged = (newPath, oldPath) => {
            this.state.libraryPath = newPath;
            if (this.loadedMods) {
                this.loadedMods.forEach(mod => {
                    if (!this.activeMods.has(mod.folder)) return;
                    if (mod.onLibraryChanged) {
                        mod.onLibraryChanged(newPath, oldPath);
                    }
                });
            }
        };

        // Initialize state
        this.state.libraryPath = eagle.library.path;
        ModManager.instance = this;
    }

    cleanup() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.loadedMods = [];
        this.activeMods.clear();
        this.state = {
            selectedItems: [],
            selectedFolder: null,
            libraryPath: ''
        };
        eagle.onLibraryChanged = null;
    }

    async loadMods() {
        try {
            // Ensure both directories exist
            await fs.promises.mkdir(CONSTANTS.MOD_DIRS.BUILTIN, { recursive: true });
            await fs.promises.mkdir(CONSTANTS.MOD_DIRS.USER, { recursive: true });

            console.log('Loading mods from', CONSTANTS.MOD_DIRS.BUILTIN);
            const builtinMods = await this._loadFromDirectory(CONSTANTS.MOD_DIRS.BUILTIN, true);
            let userMods = [];
            
            if (ModManager.isGitInstalled()) {
                try {
                    const dirents = await fs.promises.readdir(CONSTANTS.MOD_DIRS.USER, { withFileTypes: true });
                    const repoFolders = dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

                    for (const repoFolder of repoFolders) {
                        const repoPath = path.join(CONSTANTS.MOD_DIRS.USER, repoFolder);
                        const gitDir = path.join(repoPath, '.git');

                        if (fs.existsSync(gitDir)) {
                            // Check last pull time
                            const lastPullKey = `lastPull_${repoFolder}`;
                            const lastPull = localStorage.getItem(lastPullKey);
                            const now = Date.now();
                            const shouldPull = !lastPull || (now - parseInt(lastPull)) > 24 * 60 * 60 * 1000;

                            if (shouldPull) {
                                try {
                                    execSync('git pull', { cwd: repoPath, stdio: 'ignore' });
                                    localStorage.setItem(lastPullKey, now.toString());
                                } catch (error) {
                                    console.error(`Failed to pull updates for ${repoFolder}:`, error);
                                }
                            }

                            // Load mods from the mods subdirectory if it exists
                            const modsPath = path.join(repoPath, 'mods');
                            if (fs.existsSync(modsPath)) {
                                const folderMods = await this._loadFromDirectory(modsPath, false);
                                // Add repo info to each mod for proper path resolution
                                folderMods.forEach(mod => {
                                    if (mod) {
                                        mod.repoFolder = repoFolder;
                                    }
                                });
                                userMods = userMods.concat(folderMods);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to process user mods:', error);
                }
            }

            const allMods = this._sortMods([...builtinMods, ...userMods]);
            this.loadedMods = allMods;
            return allMods;
        } catch (error) {
            console.error('Failed to load mods:', error);
            return [];
        }
    }

    async _loadFromDirectory(modsDir, isBuiltin) {
        try {
            const dirents = await fs.promises.readdir(modsDir, { withFileTypes: true });
            const modFolders = dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
            
            return Promise.all(modFolders.map(folder => this._loadMod(modsDir, folder, isBuiltin)));
        } catch (error) {
            console.error(`Failed to read mods directory ${modsDir}:`, error);
            return [];
        }
    }

    async _loadMod(modsDir, folder, isBuiltin) {
        try {
            if (this.modCache.has(folder)) {
                return this.modCache.get(folder);
            }

            const modPath = path.join(modsDir, folder, 'index.js');
            const modModule = require(modPath);
            
            // Bind event handlers to preserve context
            const boundHandlers = {
                onLibraryChanged: modModule.onLibraryChanged?.bind(modModule),
                onItemSelected: modModule.onItemSelected?.bind(modModule),
                onFolderSelected: modModule.onFolderSelected?.bind(modModule)
            };
            
            const modData = {
                name: modModule.name || folder,
                folder,
                content: modModule.render ? modModule.render() : '',
                mount: async (container) => {
                    // Mark mod as active when mounted
                    this.activeMods.add(folder);
                    console.log('Mounting mod:', folder, 'Has folder handler:', !!boundHandlers.onFolderSelected);
                    
                    // Call the original mount function if it exists
                    if (modModule.mount) {
                        const cleanup = await modModule.mount(container);
                        // Wrap the cleanup to handle our active state
                        return () => {
                            this.activeMods.delete(folder);
                            if (cleanup) cleanup();
                        };
                    }
                    // Return a cleanup function that removes from active mods
                    return () => {
                        this.activeMods.delete(folder);
                    };
                },
                styles: modModule.styles || [],
                isBuiltin,
                // Use bound event handlers
                ...boundHandlers
            };

            this.modCache.set(folder, modData);
            return modData;
        } catch (error) {
            console.error(`Failed to load mod ${folder}:`, error);
            return null;
        }
    }

    _sortMods(mods) {
        return mods.filter(Boolean).sort((a, b) => {
            const aIndex = CONSTANTS.FIXED_ORDER.indexOf(a.folder);
            const bIndex = CONSTANTS.FIXED_ORDER.indexOf(b.folder);
            
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            return a.name.localeCompare(b.name);
        });
    }

    static isGitInstalled() {
        try {
            execSync('git --version', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    // Helper method to compare item arrays
    _areItemArraysEqual(items1, items2) {
        if (!items1 || !items2) return items1 === items2;
        if (items1.length !== items2.length) return false;
        return items1.every((item, index) => item.id === items2[index].id);
    }
}

// Create and export the singleton instance
module.exports = ModManager; 