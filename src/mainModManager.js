const fs = require('fs');
const { execSync } = require('child_process');

// Safely check for Electron environment
let ipcRenderer;
try {
    const electron = require('electron');
    ipcRenderer = electron.ipcRenderer;
} catch (error) {
    console.warn('Not in Electron environment, IPC will be unavailable');
}

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
        
        ModManager.instance = this;
        
        // Simple global exposure without IPC
        if (typeof window !== 'undefined') {
            window.mainModManager = this;
        } else if (typeof global !== 'undefined') {
            global.mainModManager = this;
        }
        
        this.modCache = new Map();
        this.state = {
            selectedItems: [],
            selectedFolder: null,
            libraryPath: ''
        };
        this.activeMods = new Set();
        this.pollingInterval = null;
        this.globalHandlers = new Map();
        
        // Set up library change handler if eagle exists
        if (typeof eagle !== 'undefined') {
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
        }
    }

    // Global handler registration methods
    registerGlobalHandler(modId, eventType, handler) {
        // Direct handler registration without IPC
        if (!this.globalHandlers.has(modId)) {
            this.globalHandlers.set(modId, new Map());
        }
        const modHandlers = this.globalHandlers.get(modId);
        if (!modHandlers.has(eventType)) {
            modHandlers.set(eventType, new Set());
        }
        modHandlers.get(eventType).add(handler);
    }

    unregisterGlobalHandler(modId, eventType, handler) {
        const modHandlers = this.globalHandlers.get(modId);
        if (!modHandlers) return;
        
        if (handler) {
            // Remove specific handler
            const handlers = modHandlers.get(eventType);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    modHandlers.delete(eventType);
                }
            }
        } else {
            // Remove all handlers for this event type
            modHandlers.delete(eventType);
        }

        // Clean up if no handlers left
        if (modHandlers.size === 0) {
            this.globalHandlers.delete(modId);
        }
    }

    unregisterAllGlobalHandlers(modId) {
        this.globalHandlers.delete(modId);
    }

    // Helper method to execute global handlers
    executeGlobalHandlers(eventType, ...args) {
        for (const [modId, modHandlers] of this.globalHandlers) {
            if (this.activeMods.has(modId)) {
                const handlers = modHandlers.get(eventType);
                if (handlers) {
                    handlers.forEach(handler => {
                        try {
                            handler(...args);
                        } catch (error) {
                            console.error(`Error executing handler for mod ${modId}:`, error);
                        }
                    });
                }
            }
        }
    }

    startPolling() {
        if (this.pollingInterval) return;
        
        this.pollingInterval = setInterval(async () => {
            try {
                // Handle folder selection
                const selectedFolders = await eagle.folder.getSelected();
                const newFolder = selectedFolders?.[0] || null;
                
                // Check for folder changes - only if there's an actual change
                const folderChanged = 
                    (this.state.selectedFolder === null && newFolder !== null) ||
                    (this.state.selectedFolder !== null && newFolder === null) ||
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

                // Stop polling if no active mods
                if (this.activeMods.size === 0) {
                    this.stopPolling();
                }
            } catch (error) {
                console.error('Error in event polling:', error);
            }
        }, 100);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    cleanup() {
        this.stopPolling();
        this.loadedMods = [];
        this.activeMods.clear();
        this.globalHandlers.clear();
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
            
            try {
                const dirents = await fs.promises.readdir(CONSTANTS.MOD_DIRS.USER, { withFileTypes: true });
                const repoFolders = dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

                for (const repoFolder of repoFolders) {
                    const repoPath = path.join(CONSTANTS.MOD_DIRS.USER, repoFolder);
                    const gitDir = path.join(repoPath, '.git');
                    const statePath = path.join(repoPath, 'STATE');

                    // Handle git repos
                    if (fs.existsSync(gitDir) && ModManager.isGitInstalled()) {
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
                    }
                    // Handle local packages
                    else if (fs.existsSync(statePath)) {
                        try {
                            // Read and validate STATE file first
                            const sourcePath = fs.readFileSync(statePath, 'utf8').trim();
                            
                            // Validate source path exists and has mods subdirectory
                            if (!fs.existsSync(sourcePath)) {
                                console.warn(`Source path ${sourcePath} does not exist, skipping`);
                                continue;
                            }
                            const sourceModsPath = path.join(sourcePath, 'mods');
                            if (!fs.existsSync(sourceModsPath)) {
                                console.warn(`Source path ${sourcePath} does not contain a mods directory, skipping`);
                                continue;
                            }
                            
                            // Check last update time
                            const lastUpdateKey = `lastUpdate_${repoFolder}`;
                            const lastUpdate = localStorage.getItem(lastUpdateKey);
                            const now = Date.now();
                            const shouldUpdate = !lastUpdate || (now - parseInt(lastUpdate)) > 24 * 60 * 60 * 1000;

                            if (shouldUpdate) {
                                // Delete the entire target directory
                                if (fs.existsSync(repoPath)) {
                                    await fs.promises.rm(repoPath, { recursive: true, force: true });
                                }
                                
                                // Create fresh target directory
                                await fs.promises.mkdir(repoPath, { recursive: true });
                                
                                // Copy all contents from source directory
                                await this._copyDirectory(sourcePath, repoPath);
                                
                                // Write the STATE file after copying
                                fs.writeFileSync(statePath, sourcePath);
                                
                                // Update last update time
                                localStorage.setItem(lastUpdateKey, now.toString());
                            }
                        } catch (error) {
                            console.error(`Failed to update local package ${repoFolder}:`, error);
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
            } catch (error) {
                console.error('Failed to process user mods:', error);
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
            
            // Filter out failed mods (undefined results) after loading
            const loadedMods = await Promise.all(modFolders.map(async folder => {
                try {
                    return await this._loadMod(modsDir, folder, isBuiltin);
                } catch (error) {
                    console.error(`Skipping mod ${folder} due to error:`, error);
                    return undefined;
                }
            }));
            return loadedMods.filter(mod => mod !== undefined);
        } catch (error) {
            console.error(`Failed to read mods directory ${modsDir}:`, error);
            return [];
        }
    }

    async _loadMod(modsDir, folder, isBuiltin) {
        if (this.modCache.has(folder)) {
            return this.modCache.get(folder);
        }

        // Ensure ModManager is available in global scope before loading mod
        if (typeof global !== 'undefined' && !global.mainModManager) {
            global.mainModManager = ModManager.instance;
        } else if (typeof window !== 'undefined' && !window.mainModManager) {
            window.mainModManager = ModManager.instance;
        }

        const modPath = path.join(modsDir, folder, 'index.js');
        const htmlPath = path.join(modsDir, folder, 'index.html');
        
        let modModule;
        let htmlContent = '';
        
        // Try loading HTML file first
        if (fs.existsSync(htmlPath)) {
            htmlContent = fs.readFileSync(htmlPath, 'utf8');
        }
        
        // Load JS module if it exists
        if (fs.existsSync(modPath)) {
            modModule = require(modPath);
        } else if (!htmlContent) {
            throw new Error('Neither index.js nor index.html found in mod folder');
        } else {
            modModule = {};
        }

        // Handle render content
        if (modModule.render) {
            if (typeof modModule.render === 'function') {
                htmlContent = modModule.render() || htmlContent;
            } else if (typeof modModule.render === 'string') {
                // If render is a path, load that file's content
                const renderPath = path.join(modsDir, folder, modModule.render);
                if (fs.existsSync(renderPath)) {
                    htmlContent = fs.readFileSync(renderPath, 'utf8');
                } else {
                    console.warn(`Render path ${renderPath} not found for mod ${folder}`);
                }
            }
        }
        
        // Bind event handlers to preserve context
        const boundHandlers = {
            onLibraryChanged: modModule.onLibraryChanged?.bind(modModule),
            onItemSelected: modModule.onItemSelected?.bind(modModule),
            onFolderSelected: modModule.onFolderSelected?.bind(modModule)
        };
        
        const modData = {
            name: modModule.name || folder,
            folder,
            content: htmlContent,
            mount: async (container) => {
                // Mark mod as active when mounted
                this.activeMods.add(folder);
                console.log('Mounting mod:', folder, 'Has folder handler:', !!boundHandlers.onFolderSelected);
                
                // Start polling when a mod becomes active
                this.startPolling();
                
                // Call the original mount function if it exists
                if (modModule.mount) {
                    const cleanup = await modModule.mount(container);
                    // Wrap the cleanup to handle our active state
                    return () => {
                        this.unregisterAllGlobalHandlers(folder);
                        this.activeMods.delete(folder);
                        if (cleanup) cleanup();
                        // Stop polling if no more active mods
                        if (this.activeMods.size === 0) {
                            this.stopPolling();
                        }
                    };
                }
                // Return a cleanup function that removes from active mods
                return () => {
                    this.unregisterAllGlobalHandlers(folder);
                    this.activeMods.delete(folder);
                    // Stop polling if no more active mods
                    if (this.activeMods.size === 0) {
                        this.stopPolling();
                    }
                };
            },
            styles: modModule.styles || [],
            isBuiltin,
            visibility: isBuiltin ? true : modModule.visibility ?? false,
            // Use bound event handlers
            ...boundHandlers
        };

        this.modCache.set(folder, modData);
        return modData;
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

    // Helper method to broadcast updates to renderer processes
    broadcastUpdate() {
        if (typeof window !== 'undefined') return; // Skip if in renderer
        
        const updateData = {
            state: this.state,
            activeMods: Array.from(this.activeMods),
            globalHandlers: this.serializeHandlers(this.globalHandlers)
        };
        
        try {
            // Broadcast to all renderer processes
            const electron = require('electron');
            const windows = electron.BrowserWindow.getAllWindows();
            windows.forEach(win => {
                win.webContents.send('mod-manager-update', updateData);
            });
        } catch (error) {
            console.warn('Failed to broadcast update:', error);
        }
    }

    // Helper method to serialize handlers for IPC
    serializeHandlers(handlersMap) {
        const serialized = {};
        for (const [modId, handlers] of handlersMap) {
            serialized[modId] = {};
            for (const [eventType, handlerSet] of handlers) {
                serialized[modId][eventType] = Array.from(handlerSet);
            }
        }
        return serialized;
    }

    // Helper method to recursively copy directory contents
    async _copyDirectory(src, dest) {
        const entries = await fs.promises.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await fs.promises.mkdir(destPath, { recursive: true });
                await this._copyDirectory(srcPath, destPath);
            } else {
                await fs.promises.copyFile(srcPath, destPath);
            }
        }
    }
}

// Create and export the singleton instance
module.exports = ModManager; 