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
                const gitDir = path.join(repoPath, ".git");
                const modsDir = path.join(repoPath, "mods");

                if (fs.existsSync(gitDir) && fs.existsSync(modsDir)) {
                  return {
                    name: folder,
                    path: repoPath,
                    updating: false,
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
            execSync("git pull", {
              cwd: repo.path,
              stdio: "ignore",
            });

            // Reload mods to reflect changes
            const modManager = new ModManager();
            this.mods = await modManager.loadMods();

            // Update last pull time
            const lastPullKey = `lastPull_${repo.name}`;
            localStorage.setItem(lastPullKey, Date.now().toString());
          } catch (error) {
            console.error(`Failed to update mod ${repo.name}:`, error);
          } finally {
            repo.updating = false;
          }
        },
        async removeMod(repo) {
          try {
            // Remove the repository directory
            await fs.promises.rm(repo.path, { recursive: true, force: true });

            // Remove from installed repos list
            const index = this.installedRepos.indexOf(repo);
            if (index > -1) {
              this.installedRepos.splice(index, 1);
            }

            // Remove last pull time from localStorage
            const lastPullKey = `lastPull_${repo.name}`;
            localStorage.removeItem(lastPullKey);

            // Reload mods to reflect changes
            const modManager = new ModManager();
            this.mods = await modManager.loadMods();

            // Update installation status if this was the current repo
            if (this.modRepoUrl.endsWith(repo.name)) {
              this.isModInstalled = false;
            }
          } catch (error) {
            console.error(`Failed to remove mod ${repo.name}:`, error);
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

            // Clone the repository
            execSync(`git clone ${this.modRepoUrl}`, {
              cwd: CONSTANTS.MOD_DIRS.USER,
              stdio: "ignore",
            });

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
          } catch (error) {
            console.error("Failed to install mod:", error);
          }
        },
      },
    });
  }
  
  app.mount("#app");
});
