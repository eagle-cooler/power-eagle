const fs = require('fs');
const { execSync } = require('child_process');

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

module.exports = ModManager; 