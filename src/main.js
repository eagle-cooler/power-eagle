const { createApp } = Vue;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants
const CONSTANTS = {
    FIXED_ORDER: ['about', 'mods'],
    MOD_DIRS: {
        BUILTIN: path.join(__dirname, '..', 'mods'),
        USER: path.join(eagle.os.homedir(), '.eaglecooler', 'powereagle', 'mods')
    }
};

// Mod Manager
class ModManager {
    constructor() {
        this.modCache = new Map();
    }

    static isGitInstalled() {
        try {
            execSync('git --version', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    async loadMods() {
        console.log('Loading mods from {}...', CONSTANTS.MOD_DIRS.BUILTIN);
        const builtinMods = await this._loadFromDirectory(CONSTANTS.MOD_DIRS.BUILTIN, true);
        let userMods = [];
        
        if (this.constructor.isGitInstalled()) {
            try {
                // Create user mods directory if it doesn't exist
                if (!fs.existsSync(CONSTANTS.MOD_DIRS.USER)) {
                    await fs.promises.mkdir(CONSTANTS.MOD_DIRS.USER, { recursive: true });
                }

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

        return this._sortMods([...builtinMods, ...userMods]);
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
            
            const modData = {
                name: modModule.name || folder,
                folder,
                content: modModule.render ? modModule.render() : '',
                mount: modModule.mount || (() => {}),
                styles: modModule.styles || [],
                isBuiltin
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
}

// UI Manager
class UIManager {
    static async loadModContent(mod) {
        const contentDiv = document.querySelector('.main-content > div');
        
        if (mod.folder === 'mods') {
            await this._loadModsModContent(mod, contentDiv);
        } else {
            contentDiv.innerHTML = mod.content;
        }
        
        await this._loadStyles(mod);
        
        if (mod.mount) {
            mod.mount(contentDiv);
        }
    }

    static async _loadModsModContent(mod, contentDiv) {
        const controlsHtml = `
            <div class="mods-controls">
                <div class="menu-controls">
                    <h2>Menu Item Controls</h2>
                    <button class="toggle-all" id="toggleAllBtn">Show/Hide All</button>
                    <div class="menu-items-control" id="menuItemsControl"></div>
                </div>
                ${!ModManager.isGitInstalled() ? 
                    '<div class="git-warning">Git is not installed. Loading external mods is not supported.</div>' 
                    : ''}
            </div>
        `;
        contentDiv.innerHTML = controlsHtml + (mod.content || '');
        
        await this._setupModsControls();
    }

    static async _setupModsControls() {
        const toggleAllBtn = document.getElementById('toggleAllBtn');
        const menuItemsControl = document.getElementById('menuItemsControl');
        
        if (toggleAllBtn && menuItemsControl) {
            toggleAllBtn.textContent = app.allModsVisible ? 'Hide All' : 'Show All';
            toggleAllBtn.addEventListener('click', () => app.toggleAllMods());
            
            const modsHtml = app.mods.map(m => `
                <div class="menu-item-toggle">
                    <input 
                        type="checkbox" 
                        id="toggle-${m.folder}"
                        ${app.modVisibility[m.folder] ? 'checked' : ''}
                        ${m.folder === 'mods' ? 'disabled' : ''}
                    >
                    <label for="toggle-${m.folder}" ${m.folder === 'mods' ? 'class="mods-label"' : ''}>
                        ${m.name}
                        ${m.folder === 'mods' ? '<span class="mods-note">(always visible)</span>' : ''}
                    </label>
                </div>
            `).join('');
            
            menuItemsControl.innerHTML = modsHtml;
            
            app.mods.forEach(m => {
                if (m.folder !== 'mods') {
                    const checkbox = document.getElementById(`toggle-${m.folder}`);
                    if (checkbox) {
                        checkbox.addEventListener('change', () => {
                            app.modVisibility[m.folder] = checkbox.checked;
                            app.updateModVisibility(m.folder);
                        });
                    }
                }
            });
        }
    }

    static async _loadStyles(mod) {
        mod.styles.forEach(stylePath => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            if (mod.isBuiltin) {
                link.href = `../mods/${mod.folder}/${stylePath}`;
            } else {
                // For user mods, use absolute file:// URL with repo folder structure
                const absolutePath = path.join(CONSTANTS.MOD_DIRS.USER, mod.repoFolder, 'mods', mod.folder, stylePath);
                link.href = `file://${absolutePath.replace(/\\/g, '/')}`;
            }
            document.head.appendChild(link);
        });
    }
}

// Vue app
const app = createApp({
    data() {
        return {
            mods: [],
            activeMod: null,
            searchQuery: '',
            modVisibility: {},
            allModsVisible: true,
            modRepoUrl: 'https://github.com/eagle-cooler/power-eagle-mods',
            isModInstalled: false,
            checkTimer: null
        }
    },
    watch: {
        modRepoUrl(newUrl) {
            // Clear any existing timer
            if (this.checkTimer) {
                clearTimeout(this.checkTimer);
            }
            
            // Set a new timer for 3 seconds
            this.checkTimer = setTimeout(() => {
                this.checkModInstallation();
            }, 3000);
        }
    },
    computed: {
        filteredMods() {
            const query = this.searchQuery.toLowerCase().trim();
            return this.mods.filter(mod => 
                mod.name.toLowerCase().includes(query)
            );
        }
    },
    async mounted() {
        const modManager = new ModManager();
        this.mods = await modManager.loadMods();
        
        // Load saved visibility states or initialize defaults
        const savedVisibility = localStorage.getItem('modVisibility');
        if (savedVisibility) {
            this.modVisibility = JSON.parse(savedVisibility);
        } else {
            // Initialize visibility state for all mods
            this.mods.forEach(mod => {
                this.modVisibility[mod.folder] = mod.isBuiltin || mod.folder === 'mods';
            });
            this.saveVisibilityState();
        }

        // Update allModsVisible based on non-mods mods
        this.allModsVisible = Object.entries(this.modVisibility)
            .filter(([key]) => key !== 'mods')
            .every(([, value]) => value);
        
        if (this.mods.length > 0) {
            this.setActiveMod(this.mods[0]);
        }

        // Initial check for mod installation
        this.checkModInstallation();
    },
    beforeUnmount() {
        // Clear any existing timer when component is unmounted
        if (this.checkTimer) {
            clearTimeout(this.checkTimer);
        }
    },
    methods: {
        saveVisibilityState() {
            localStorage.setItem('modVisibility', JSON.stringify(this.modVisibility));
        },
        async setActiveMod(mod) {
            this.activeMod = mod;
            await this.$nextTick();
            await UIManager.loadModContent(mod);
        },
        isModVisible(folder) {
            return folder === 'mods' ? true : this.modVisibility[folder];
        },
        updateModVisibility(folder) {
            if (folder === 'mods') return;
            
            this.allModsVisible = Object.entries(this.modVisibility)
                .filter(([key]) => key !== 'mods')
                .every(([, value]) => value);
            
            this.saveVisibilityState();
            
            if (!this.modVisibility[folder] && this.activeMod?.folder === folder) {
                const firstVisibleMod = this.mods.find(m => this.isModVisible(m.folder));
                if (firstVisibleMod) {
                    this.setActiveMod(firstVisibleMod);
                }
            }
        },
        toggleAllMods() {
            const newState = !this.allModsVisible;
            this.mods.forEach(mod => {
                if (mod.folder !== 'mods') {
                    this.modVisibility[mod.folder] = newState;
                    const checkbox = document.getElementById(`toggle-${mod.folder}`);
                    if (checkbox) {
                        checkbox.checked = newState;
                    }
                }
            });
            this.allModsVisible = newState;
            
            this.saveVisibilityState();
            
            if (!newState && this.activeMod?.folder !== 'mods') {
                const modsModule = this.mods.find(m => m.folder === 'mods');
                if (modsModule) {
                    this.setActiveMod(modsModule);
                }
            }
        },
        async checkModInstallation() {
            try {
                const repoName = this.modRepoUrl.split('/').pop();
                // Check both direct path and nested mods path
                const repoPath = path.join(CONSTANTS.MOD_DIRS.USER, repoName);
                const modsPath = path.join(repoPath, 'mods');
                
                this.isModInstalled = fs.existsSync(repoPath) && fs.existsSync(modsPath);
            } catch (error) {
                console.error('Failed to check mod installation:', error);
                this.isModInstalled = false;
            }
        },
        async installMod() {
            try {
                const repoName = this.modRepoUrl.split('/').pop();
                const modPath = path.join(CONSTANTS.MOD_DIRS.USER, repoName);

                if (!fs.existsSync(CONSTANTS.MOD_DIRS.USER)) {
                    await fs.promises.mkdir(CONSTANTS.MOD_DIRS.USER, { recursive: true });
                }

                // Clone the repository
                execSync(`git clone ${this.modRepoUrl}`, { 
                    cwd: CONSTANTS.MOD_DIRS.USER,
                    stdio: 'ignore' 
                });

                // Update installation status
                this.isModInstalled = true;

                // Reload mods
                const modManager = new ModManager();
                this.mods = await modManager.loadMods();

                // Refresh visibility states
                this.mods.forEach(mod => {
                    if (!this.modVisibility.hasOwnProperty(mod.folder)) {
                        this.modVisibility[mod.folder] = !mod.isBuiltin;
                    }
                });
                this.saveVisibilityState();
            } catch (error) {
                console.error('Failed to install mod:', error);
            }
        }
    }
}).mount('#app');