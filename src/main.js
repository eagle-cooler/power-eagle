const { createApp } = Vue;
const fs = require('fs');
const path = require('path');

// Cache for plugin modules
const pluginCache = new Map();
const FIXED_ORDER = ['about', 'mods'];
const pluginBuiltinDir = path.join(__dirname, '..', 'plugins');
const pluginUserDir = path.join(eagle.os.homedir(), '.eaglecooler', 'powereagle', 'plugins');
// touch folder
fs.mkdirSync(pluginUserDir, { recursive: true });

async function loadPlugins(pluginsDir) {
    const pluginFolders = await fs.promises.readdir(pluginsDir, { withFileTypes: true })
        .then(dirents => dirents
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
        );

    const plugins = [];
    
    for (const folder of pluginFolders) {
        try {
            if (pluginCache.has(folder)) {
                plugins.push(pluginCache.get(folder));
                continue;
            }

            const pluginPath = path.join(pluginsDir, folder, 'index.js');
            const pluginModule = require(pluginPath);
            
            const pluginData = {
                name: pluginModule.name || folder,
                folder,
                content: pluginModule.render ? pluginModule.render() : '',
                mount: pluginModule.mount || (() => {}),
                styles: pluginModule.styles || []
            };

            pluginCache.set(folder, pluginData);
            plugins.push(pluginData);
            
        } catch (error) {
            console.error(`Failed to load plugin ${folder}:`, error);
        }
    }

    return plugins.sort((a, b) => {
        const aIndex = FIXED_ORDER.indexOf(a.folder);
        const bIndex = FIXED_ORDER.indexOf(b.folder);
        
        // Handle fixed order first
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // Then sort others alphabetically
        return a.name.localeCompare(b.name);
    });
}

async function loadPluginContent(plugin) {
    const contentDiv = document.querySelector('.main-content > div');
    
    // Special handling for mods plugin
    if (plugin.folder === 'mods') {
        const controlsHtml = `
            <div class="mods-controls">
                <div class="menu-controls">
                    <h2>Menu Item Controls</h2>
                    <button class="toggle-all" id="toggleAllBtn">Show/Hide All</button>
                    <div class="menu-items-control" id="menuItemsControl"></div>
                </div>
            </div>
        `;
        contentDiv.innerHTML = controlsHtml + (plugin.content || '');
        
        // Add event listeners and populate controls after content is set
        const toggleAllBtn = document.getElementById('toggleAllBtn');
        const menuItemsControl = document.getElementById('menuItemsControl');
        
        if (toggleAllBtn && menuItemsControl) {
            // Update toggle all button text
            toggleAllBtn.textContent = app.allPluginsVisible ? 'Hide All' : 'Show All';
            toggleAllBtn.addEventListener('click', () => app.toggleAllPlugins());
            
            // Create checkbox controls
            const pluginsHtml = app.plugins.map(p => `
                <div class="menu-item-toggle">
                    <input 
                        type="checkbox" 
                        id="toggle-${p.folder}"
                        ${app.pluginVisibility[p.folder] ? 'checked' : ''}
                        ${p.folder === 'mods' ? 'disabled' : ''}
                    >
                    <label for="toggle-${p.folder}" ${p.folder === 'mods' ? 'class="mods-label"' : ''}>
                        ${p.name}
                        ${p.folder === 'mods' ? '<span class="mods-note">(always visible)</span>' : ''}
                    </label>
                </div>
            `).join('');
            
            menuItemsControl.innerHTML = pluginsHtml;
            
            // Add event listeners to checkboxes
            app.plugins.forEach(p => {
                if (p.folder !== 'mods') { // Skip mods plugin
                    const checkbox = document.getElementById(`toggle-${p.folder}`);
                    if (checkbox) {
                        checkbox.addEventListener('change', () => {
                            app.pluginVisibility[p.folder] = checkbox.checked;
                            app.updatePluginVisibility(p.folder);
                        });
                    }
                }
            });
        }
    } else {
        contentDiv.innerHTML = plugin.content;
    }
    
    // Load styles
    plugin.styles.forEach(stylePath => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `../plugins/${plugin.folder}/${stylePath}`;
        document.head.appendChild(link);
    });
    
    // Initialize plugin
    if (plugin.mount) {
        plugin.mount(contentDiv);
    }
}

// Vue app
const app = createApp({
    data() {
        return {
            plugins: [],
            activePlugin: null,
            searchQuery: '',
            pluginVisibility: {},
            allPluginsVisible: true
        }
    },
    computed: {
        filteredPlugins() {
            const query = this.searchQuery.toLowerCase().trim();
            return this.plugins.filter(plugin => 
                plugin.name.toLowerCase().includes(query)
            );
        }
    },
    async mounted() {
        this.plugins = await loadPlugins(pluginBuiltinDir);
        // extend the list for user scope
        this.plugins.push(...(await loadPlugins(pluginUserDir)));
        
        // Initialize visibility state for all plugins
        this.plugins.forEach(plugin => {
            this.pluginVisibility[plugin.folder] = true;
        });
        
        if (this.plugins.length > 0) {
            this.setActivePlugin(this.plugins[0]);
        }
    },
    methods: {
        async setActivePlugin(plugin) {
            this.activePlugin = plugin;
            await this.$nextTick();
            await loadPluginContent(plugin);
        },
        isPluginVisible(folder) {
            return folder === 'mods' ? true : this.pluginVisibility[folder];
        },
        updatePluginVisibility(folder) {
            if (folder === 'mods') return; // Prevent mods from being hidden
            
            // Update allPluginsVisible state based on non-mods plugins
            this.allPluginsVisible = Object.entries(this.pluginVisibility)
                .filter(([key]) => key !== 'mods')
                .every(([, value]) => value);
            
            // If the active plugin is hidden, switch to the first visible plugin
            if (!this.pluginVisibility[folder] && this.activePlugin?.folder === folder) {
                const firstVisiblePlugin = this.plugins.find(p => this.isPluginVisible(p.folder));
                if (firstVisiblePlugin) {
                    this.setActivePlugin(firstVisiblePlugin);
                }
            }
        },
        toggleAllPlugins() {
            const newState = !this.allPluginsVisible;
            this.plugins.forEach(plugin => {
                if (plugin.folder !== 'mods') { // Skip mods plugin
                    this.pluginVisibility[plugin.folder] = newState;
                }
            });
            this.allPluginsVisible = newState;
        }
    }
}).mount('#app');