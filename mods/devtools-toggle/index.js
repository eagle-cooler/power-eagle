const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    name: 'Plugin DevTools Toggles',
    styles: ['styles.css'],
    render: () => `
        <div class="plugin-load-container">
            <h2>Plugin DevTools Toggles</h2>
            <div class="restart-notice" title="Double-click to restart Eagle">
                <span class="icon">⚠️</span>
                <span class="text">Changes require an Eagle restart to take effect</span>
                <span class="hint">(Double-click to restart)</span>
            </div>
            <div class="self-mod-card"></div>
            <div class="plugin-cards"></div>
        </div>
    `,
    mount: (container) => {
        const pluginsPath = path.join(process.env.APPDATA, 'Eagle', 'Plugins');
        const selfModPath = eagle.plugin.path;
        const isWindows = process.platform === 'win32';

        async function restartEagle() {
            if (!isWindows) return;
            
            // Create a temporary batch file for the restart sequence
            const tempBatPath = path.join(process.env.TEMP, 'eagleRestart.bat');
            const batContent = `
@echo off
timeout /t 3 /nobreak > nul
start "" eagle://
del "%~f0"
exit
            `.trim();

            try {
                fs.writeFileSync(tempBatPath, batContent);
                
                // Launch the batch file in a visible process
                exec(`start cmd /c "${tempBatPath}"`, {
                    detached: true,
                    windowsHide: false
                }, (error) => {
                    if (error) {
                        console.error('Error setting up Eagle restart:', error);
                        return;
                    }
                });

                // sleep 1 second
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Now we can safely exit the current Eagle instance
                exec('taskkill /F /IM "Eagle.exe"', (error) => {
                    if (error) {
                        console.error('Error closing Eagle:', error);
                    }
                });
            } catch (err) {
                console.error('Error creating restart script:', err);
            }
        }

        function createSelfModControl() {
            const selfModContainer = container.querySelector('.self-mod-card');
            const manifestPath = path.join(selfModPath, 'manifest.json');
            let manifest = { devTools: false };

            try {
                if (fs.existsSync(manifestPath)) {
                    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                } else {
                    // Create manifest for self if it doesn't exist
                    manifest = {
                        name: "Plugin DevTools Toggles",
                        description: "Control panel for managing plugin development tools",
                        version: "1.0.0",
                        devTools: false
                    };
                    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
                }

                selfModContainer.innerHTML = `
                    <div class="plugin-card self-mod" data-plugin-path="${selfModPath}">
                        <div class="plugin-info">
                            <h3>🛠️ ${manifest.name} (Self)</h3>
                            <p>${manifest.description || 'Development tools control panel'}</p>
                        </div>
                        <div class="plugin-controls">
                            <label class="toggle-switch">
                                <input type="checkbox" ${manifest.devTools ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                `;
            } catch (err) {
                console.error('Error setting up self-mod control:', err);
                selfModContainer.innerHTML = `
                    <div class="plugin-card error">
                        <div class="plugin-info">
                            <h3>⚠️ Self-mod Control</h3>
                            <p>Error setting up self-mod control</p>
                        </div>
                    </div>
                `;
            }
        }

        function getLocalizedName(pluginPath, manifest) {
            // Check if the name is a template literal with {{manifest.app.name}}
            if (manifest.name && manifest.name.includes('{{manifest.app.name}}')) {
                const localesPath = path.join(pluginPath, '_locales');
                
                try {
                    // Get Eagle's current locale or fallback to 'en'
                    const locale = eagle.app.locale || 'en';
                    const localePath = path.join(localesPath, `${locale}.json`);
                    
                    if (fs.existsSync(localePath)) {
                        const localeData = JSON.parse(fs.readFileSync(localePath, 'utf8'));
                        if (localeData.manifest?.app?.name) {
                            return localeData.manifest.app.name;
                        }
                    }
                    
                    // Fallback to English if current locale file doesn't exist
                    const enPath = path.join(localesPath, 'en.json');
                    if (fs.existsSync(enPath)) {
                        const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
                        if (enData.manifest?.app?.name) {
                            return enData.manifest.app.name;
                        }
                    }
                } catch (err) {
                    console.error(`Error loading localized name:`, err);
                }
            }
            
            return manifest.name || path.basename(pluginPath);
        }

        function createPluginCard(pluginPath, manifest) {
            const displayName = getLocalizedName(pluginPath, manifest);
            return `
                <div class="plugin-card" data-plugin-path="${pluginPath}">
                    <div class="plugin-info">
                        <h3>${displayName}</h3>
                        <p>${manifest.description || 'No description available'}</p>
                    </div>
                    <div class="plugin-controls">
                        <label class="toggle-switch">
                            <input type="checkbox" ${manifest.devTools ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            `;
        }

        function loadPlugins() {
            const pluginCardsContainer = container.querySelector('.plugin-cards');
            let pluginCardsHTML = '';

            try {
                const plugins = fs.readdirSync(pluginsPath);
                
                plugins.forEach(pluginId => {
                    const pluginPath = path.join(pluginsPath, pluginId);
                    
                    // Skip if this is the self-mod by comparing actual paths
                    if (path.resolve(pluginPath) === path.resolve(selfModPath)) return;
                    
                    const manifestPath = path.join(pluginPath, 'manifest.json');
                    
                    if (fs.existsSync(manifestPath)) {
                        try {
                            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                            pluginCardsHTML += createPluginCard(pluginPath, manifest);
                        } catch (err) {
                            console.error(`Error reading manifest for ${pluginId}:`, err);
                        }
                    }
                });

                pluginCardsContainer.innerHTML = pluginCardsHTML || '<p class="no-plugins">No plugins found</p>';
            } catch (err) {
                console.error('Error loading plugins:', err);
                pluginCardsContainer.innerHTML = '<p class="no-plugins">Error loading plugins</p>';
            }
        }

        function handleToggle(e) {
            const toggle = e.target;
            if (toggle.type === 'checkbox') {
                const card = toggle.closest('.plugin-card');
                const pluginPath = card.dataset.pluginPath;
                const manifestPath = path.join(pluginPath, 'manifest.json');

                try {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    manifest.devTools = toggle.checked;
                    
                    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));

                    // Show restart notice more prominently
                    const notice = container.querySelector('.restart-notice');
                    notice.classList.add('highlight');
                    setTimeout(() => notice.classList.remove('highlight'), 1000);
                } catch (err) {
                    console.error(`Error updating manifest for ${pluginPath}:`, err);
                    toggle.checked = !toggle.checked; // Revert the toggle if failed
                }
            }
        }

        // Initial setup
        createSelfModControl();
        loadPlugins();

        // Event listeners
        container.addEventListener('change', handleToggle);
        
        // Add restart handler (Windows only)
        if (isWindows) {
            const restartNotice = container.querySelector('.restart-notice');
            restartNotice.addEventListener('dblclick', restartEagle);
            restartNotice.classList.add('windows-restart');
        }
    }
};