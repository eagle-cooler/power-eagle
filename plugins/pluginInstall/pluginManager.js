class PluginManager {
    constructor() {
        this.plugins = [
            {
                name: 'Power Eagle Core',
                description: 'Essential core functionality',
                versions: {
                    latest: '2.1.0',
                    current: '2.0.0',
                    available: ['2.0.0', '1.9.0', '1.8.0']
                },
                installed: true
            },
            {
                name: 'Power Eagle Analytics',
                description: 'Analytics and reporting tools',
                versions: {
                    latest: '1.5.0',
                    current: '1.4.2',
                    available: ['1.4.2', '1.4.0', '1.3.0']
                },
                installed: true
            },
            {
                name: 'UI Extensions',
                description: 'Additional UI components',
                versions: {
                    latest: '3.0.0',
                    current: '2.8.5',
                    available: ['2.8.5', '2.8.0', '2.7.0']
                },
                installed: false
            }
        ];
    }

    getAllPlugins() {
        return this.plugins;
    }

    getInstalledPlugins() {
        return this.plugins.filter(p => p.installed);
    }

    getAvailablePlugins() {
        return this.plugins.filter(p => !p.installed);
    }

    searchPlugins(term) {
        const searchTerm = term.toLowerCase();
        return this.plugins.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    async installPlugin(name, version) {
        console.log(`Installing ${name}@${version}`);
        // Add actual installation logic here
        const plugin = this.plugins.find(p => p.name === name);
        if (plugin) {
            plugin.installed = true;
            plugin.versions.current = version;
        }
        return true;
    }

    async updatePlugin(name, version) {
        console.log(`Updating ${name} to version ${version}`);
        // Add actual update logic here
        const plugin = this.plugins.find(p => p.name === name);
        if (plugin && plugin.installed) {
            plugin.versions.current = version;
        }
        return true;
    }

    needsUpdate(plugin) {
        return plugin.installed && plugin.versions.current !== plugin.versions.latest;
    }
}

module.exports = new PluginManager(); 