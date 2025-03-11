const { createApp } = Vue;

let app = null;
const modManager = new ModManager();;

eagle.onPluginRun(async () => {
  console.log(eagle.plugin);
  if (!app) {
    app = createApp({
      data() {
        return {
          mods: [],
          activeMod: null,
          searchQuery: "",
          modVisibility: {},
          allModsVisible: true,
          modRepoUrl: "https://github.com/eagle-cooler/power-eagle-mods",
          isModInstalled: false,
          checkTimer: null,
          installedRepos: [],
        };
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
        },
      },
      computed: {
        filteredMods() {
          const query = this.searchQuery.toLowerCase().trim();
          return this.mods.filter((mod) =>
            mod.name.toLowerCase().includes(query)
          );
        },
      },
      async mounted() {
        this.mods = await modManager.loadMods();

        // Load saved visibility states or initialize defaults
        const savedVisibility = localStorage.getItem("modVisibility");
        if (savedVisibility) {
          this.modVisibility = JSON.parse(savedVisibility);
        } else {
          // Initialize visibility state for all mods
          this.mods.forEach((mod) => {
            this.modVisibility[mod.folder] =
              mod.isBuiltin || mod.folder === "mods";
          });
          this.saveVisibilityState();
        }

        // Update allModsVisible based on non-mods mods
        this.allModsVisible = Object.entries(this.modVisibility)
          .filter(([key]) => key !== "mods")
          .every(([, value]) => value);

        // Set the Mods page as the default active mod
        const modsModule = this.mods.find(mod => mod.folder === "mods");
        if (modsModule) {
          this.setActiveMod(modsModule);
        } else if (this.mods.length > 0) {
          // Fallback to first mod if mods module is not found
          this.setActiveMod(this.mods[0]);
        }

        // Initial check for mod installation and load installed repos
        await this.checkModInstallation();
        await this.loadInstalledRepos();
      },
      beforeUnmount() {
        // Clear any existing timer when component is unmounted
        if (this.checkTimer) {
          clearTimeout(this.checkTimer);
        }
        // Clean up ModManager
        modManager.cleanup();
      },
      methods: {
        saveVisibilityState() {
          localStorage.setItem(
            "modVisibility",
            JSON.stringify(this.modVisibility)
          );
        },
        async setActiveMod(mod) {
          this.activeMod = mod;
          await this.$nextTick();
          await UIManager.loadModContent(mod, this);
        },
        isModVisible(folder) {
          return folder === "mods" ? true : this.modVisibility[folder];
        },
        updateModVisibility(folder) {
          if (folder === "mods") return;

          this.allModsVisible = Object.entries(this.modVisibility)
            .filter(([key]) => key !== "mods")
            .every(([, value]) => value);

          this.saveVisibilityState();

          if (
            !this.modVisibility[folder] &&
            this.activeMod?.folder === folder
          ) {
            const firstVisibleMod = this.mods.find((m) =>
              this.isModVisible(m.folder)
            );
            if (firstVisibleMod) {
              this.setActiveMod(firstVisibleMod);
            }
          }
        },
        toggleAllMods() {
          const newState = !this.allModsVisible;
          this.mods.forEach((mod) => {
            if (mod.folder !== "mods") {
              this.modVisibility[mod.folder] = newState;
              const checkbox = document.getElementById(`toggle-${mod.folder}`);
              if (checkbox) {
                checkbox.checked = newState;
              }
            }
          });
          this.allModsVisible = newState;

          this.saveVisibilityState();

          if (!newState && this.activeMod?.folder !== "mods") {
            const modsModule = this.mods.find((m) => m.folder === "mods");
            if (modsModule) {
              this.setActiveMod(modsModule);
            }
          }
        },
        async checkModInstallation() {
          try {
            const repoName = this.modRepoUrl.split("/").pop();
            // Check both direct path and nested mods path
            const repoPath = path.join(CONSTANTS.MOD_DIRS.USER, repoName);
            const modsPath = path.join(repoPath, "mods");

            this.isModInstalled =
              fs.existsSync(repoPath) && fs.existsSync(modsPath);
          } catch (error) {
            console.error("Failed to check mod installation:", error);
            this.isModInstalled = false;
          }
        },
        async loadInstalledRepos() {
          try {
            if (!fs.existsSync(CONSTANTS.MOD_DIRS.USER)) {
              this.installedRepos = [];
              return;
            }

            const dirents = await fs.promises.readdir(CONSTANTS.MOD_DIRS.USER, {
              withFileTypes: true,
            });
            const repoFolders = dirents
              .filter((dirent) => dirent.isDirectory())
              .map((dirent) => dirent.name);

            this.installedRepos = await Promise.all(
              repoFolders.map(async (folder) => {
                const repoPath = path.join(CONSTANTS.MOD_DIRS.USER, folder);
                const gitDir = path.join(repoPath, '.git');
                const statePath = path.join(repoPath, 'STATE');
                const modsDir = path.join(repoPath, 'mods');

                if (!fs.existsSync(modsDir)) return null;

                // Git repository
                if (fs.existsSync(gitDir)) {
                  return {
                    name: folder,
                    path: repoPath,
                    updating: false,
                    isGit: true
                  };
                }
                // Local package
                else if (fs.existsSync(statePath)) {
                  const sourcePath = fs.readFileSync(statePath, 'utf8').trim();
                  return {
                    name: folder,
                    path: repoPath,
                    sourcePath: sourcePath,
                    updating: false,
                    isGit: false
                  };
                }
                return null;
              })
            );

            this.installedRepos = this.installedRepos.filter(Boolean);
          } catch (error) {
            console.error("Failed to load installed repos:", error);
            this.installedRepos = [];
          }
        },
        async updateMod(repo) {
          try {
            repo.updating = true;
            
            if (repo.isGit) {
              // Update git repository
              execSync("git pull", {
                cwd: repo.path,
                stdio: "ignore",
              });

              // Update last pull time
              localStorage.setItem(`lastPull_${repo.name}`, Date.now().toString());
            } else {
              // Update local package by copying from source
              const sourcePath = repo.sourcePath;
              const sourceModsPath = path.join(sourcePath, 'mods');
              const destModsPath = path.join(repo.path, 'mods');

              if (!fs.existsSync(sourceModsPath)) {
                throw new Error('Source mods directory not found');
              }

              // Clear and recreate mods directory
              if (fs.existsSync(destModsPath)) {
                await fs.promises.rm(destModsPath, { recursive: true, force: true });
              }
              await fs.promises.mkdir(destModsPath, { recursive: true });

              // Copy all contents from source mods directory
              await ModManager.instance._copyDirectory(sourceModsPath, destModsPath);

              // Update last update time
              localStorage.setItem(`lastUpdate_${repo.name}`, Date.now().toString());
            }

            // Cleanup and reload mods
            modManager.cleanup();
            this.mods = await modManager.loadMods();

            // Refresh visibility states
            this.mods.forEach((mod) => {
              if (!this.modVisibility.hasOwnProperty(mod.folder)) {
                this.modVisibility[mod.folder] = !mod.isBuiltin;
              }
            });
            this.saveVisibilityState();
          } catch (error) {
            console.error(`Failed to update mod ${repo.name}:`, error);
            alert(`Failed to update ${repo.name}: ${error.message}`);
          } finally {
            repo.updating = false;
          }
        },
        async removeMod(repo) {
          // Show confirmation dialog
          const confirmed = await eagle.dialog.showMessageBox({
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm Removal',
            message: `Are you sure you want to remove ${repo.name}?`,
            detail: repo.isGit ? 
              'This will remove the git repository and all its mods.' :
              'This will remove the local package and all its mods.'
          });

          if (confirmed.response !== 0) return; // User clicked No

          try {
            // Remove the repository directory
            await fs.promises.rm(repo.path, { recursive: true, force: true });

            // Remove from installed repos list
            const index = this.installedRepos.indexOf(repo);
            if (index > -1) {
              this.installedRepos.splice(index, 1);
            }

            // Remove last pull/update time from localStorage
            if (repo.isGit) {
              localStorage.removeItem(`lastPull_${repo.name}`);
            } else {
              localStorage.removeItem(`lastUpdate_${repo.name}`);
            }

            // Cleanup and reload mods
            modManager.cleanup();
            this.mods = await modManager.loadMods();

            // Refresh visibility states
            this.mods.forEach((mod) => {
              if (!this.modVisibility.hasOwnProperty(mod.folder)) {
                this.modVisibility[mod.folder] = !mod.isBuiltin;
              }
            });
            this.saveVisibilityState();

            // Update installation status if this was the current git repo
            if (repo.isGit && this.modRepoUrl.endsWith(repo.name)) {
              this.isModInstalled = false;
            }
          } catch (error) {
            console.error(`Failed to remove mod ${repo.name}:`, error);
            alert(`Failed to remove ${repo.name}: ${error.message}`);
          }
        },
        async installMod() {
          try {
            const repoName = this.modRepoUrl.split("/").pop();
            const modPath = path.join(CONSTANTS.MOD_DIRS.USER, repoName);

            if (!fs.existsSync(CONSTANTS.MOD_DIRS.USER)) {
              await fs.promises.mkdir(CONSTANTS.MOD_DIRS.USER, {
                recursive: true,
              });
            }

            // Check if directory already exists
            if (fs.existsSync(modPath)) {
              alert(`A mod with name "${repoName}" already exists`);
              return;
            }

            try {
              // Clone the repository with stderr piped to a buffer
              const result = execSync(`git clone ${this.modRepoUrl}`, {
                cwd: CONSTANTS.MOD_DIRS.USER,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe']
              });
            } catch (gitError) {
              // If git command fails, show the error message and clean up
              if (fs.existsSync(modPath)) {
                await fs.promises.rm(modPath, { recursive: true, force: true });
              }
              throw new Error(`Git clone failed: ${gitError.stderr || gitError.message}`);
            }

            // Verify the mods directory exists
            const modsPath = path.join(modPath, "mods");
            if (!fs.existsSync(modsPath)) {
              // Clean up if no mods directory
              await fs.promises.rm(modPath, { recursive: true, force: true });
              throw new Error(`Repository "${repoName}" does not contain a mods directory`);
            }

            // Update installation status
            this.isModInstalled = true;

            // Cleanup and reload mods
            modManager.cleanup();
            this.mods = await modManager.loadMods();

            // Refresh visibility states
            this.mods.forEach((mod) => {
              if (!this.modVisibility.hasOwnProperty(mod.folder)) {
                this.modVisibility[mod.folder] = !mod.isBuiltin;
              }
            });
            this.saveVisibilityState();

            // Reload installed repos list
            await this.loadInstalledRepos();

            alert(`Successfully installed ${repoName}`);
          } catch (error) {
            console.error("Failed to install mod:", error);
            alert(`Failed to install mod: ${error.message}`);
          }
        },
      },
    });
  }
  
  app.mount("#app");
});

