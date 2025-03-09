const pluginManager = require('./pluginManager');

module.exports = {
    name: 'BRAT (Placeholder)',
    styles: ['styles.css'],
    render: () => `
        <div class="pluginInstall-container">
            <div class="pluginInstall-search-container">
                <input type="text" id="pluginInstall-search" placeholder="Search plugins...">
            </div>
            <div class="pluginInstall-sections">
                <div class="pluginInstall-section">
                    <div class="pluginInstall-installed-list"></div>
                </div>
                <div class="pluginInstall-section">
                    <div class="pluginInstall-list"></div>
                </div>
            </div>
        </div>
    `,
    mount: (container) => {
        // Render functions
        function createVersionOptions(versions, currentVersion) {
            return `
                <option value="latest" ${currentVersion === versions.latest ? 'selected' : ''}>Latest (${versions.latest})</option>
                ${versions.available.map(v => `
                    <option value="${v}" ${currentVersion === v ? 'selected' : ''}>${v}</option>
                `).join('')}
            `;
        }

        function createPluginEntry(plugin, installed = false) {
            const needsUpdate = pluginManager.needsUpdate(plugin);
            const buttonClass = installed ? (needsUpdate ? 'update-btn' : 'installed-btn') : 'install-btn';
            const buttonText = installed ? (needsUpdate ? 'Update' : 'Installed') : 'Install';
            
            return `
                <div class="plugin-entry ${installed ? 'installed' : ''}">
                    <div class="plugin-info">
                        <h3>${plugin.name}</h3>
                        <p>${plugin.description}</p>
                        ${installed ? `<p class="version-info">Current: ${plugin.versions.current}</p>` : ''}
                    </div>
                    <div class="plugin-controls">
                        <select class="version-select" ${!needsUpdate && installed ? 'disabled' : ''}>
                            ${createVersionOptions(plugin.versions, plugin.versions.current)}
                        </select>
                        <button class="${buttonClass}" ${!needsUpdate && installed ? 'disabled' : ''}>${buttonText}</button>
                    </div>
                </div>
            `;
        }

        function renderPlugins(searchTerm = '') {
            const plugins = searchTerm ? 
                pluginManager.searchPlugins(searchTerm) : 
                pluginManager.getAllPlugins();

            const installedPlugins = plugins.filter(p => p.installed);
            const availablePlugins = plugins.filter(p => !p.installed);

            container.querySelector('.pluginInstall-installed-list').innerHTML = 
                installedPlugins.map(p => createPluginEntry(p, true)).join('') || 
                '<p class="no-plugins">No installed plugins found</p>';

            container.querySelector('.pluginInstall-list').innerHTML = 
                availablePlugins.map(p => createPluginEntry(p, false)).join('') || 
                '<p class="no-plugins">No available plugins found</p>';
        }

        // Event handlers
        function handleSearch(e) {
            renderPlugins(e.target.value);
        }

        async function handleAction(e) {
            const button = e.target;
            if (button.classList.contains('install-btn') || 
                button.classList.contains('update-btn')) {
                const entry = button.closest('.plugin-entry');
                const name = entry.querySelector('h3').textContent;
                const version = entry.querySelector('select').value;
                
                if (button.classList.contains('install-btn')) {
                    await pluginManager.installPlugin(name, version);
                } else {
                    await pluginManager.updatePlugin(name, version);
                }
                
                renderPlugins(container.querySelector('#pluginInstall-search').value);
            }
        }

        // Initial setup
        renderPlugins();
        container.querySelector('#pluginInstall-search').addEventListener('input', handleSearch);
        container.querySelector('.pluginInstall-sections').addEventListener('click', handleAction);
    }
}; 