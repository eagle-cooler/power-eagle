class UIManager {
    static async loadModContent(mod, appInstance) {
        const contentDiv = document.querySelector('.main-content > div');
        
        if (mod.folder === 'mods') {
            await this._loadModsModContent(mod, contentDiv, appInstance);
        } else {
            contentDiv.innerHTML = mod.content;
        }
        
        await this._loadStyles(mod);
        
        if (mod.mount) {
            mod.mount(contentDiv);
        }
    }

    static async _loadModsModContent(mod, contentDiv, appInstance) {
        const controlsHtml = `
            <div class="mods-controls" style="max-width: 800px; margin: 0 auto;">
                <div class="menu-controls">
                    <h2>Menu Item Controls</h2>
                    <div class="controls-header" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">
                        <input type="text" id="modFilter" class="mod-filter" placeholder="Filter mods..." style="width: 100%; padding: 8px; box-sizing: border-box;">
                        <button class="toggle-all" id="toggleAllBtn" style="align-self: flex-start;">Show/Hide All</button>
                    </div>
                    <div class="menu-items-control" id="menuItemsControl"></div>
                </div>
                ${!ModManager.isGitInstalled() ? 
                    '<div class="git-warning">Git is not installed. Loading external mods is not supported.</div>' 
                    : ''}
            </div>
        `;
        contentDiv.innerHTML = controlsHtml + (mod.content || '');
        
        await this._setupModsControls(appInstance);
        this._setupModFilter();
    }

    static _setupModFilter() {
        const filterInput = document.getElementById('modFilter');
        const menuItems = document.querySelectorAll('.menu-item-toggle');
        
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                const filterText = e.target.value.toLowerCase();
                menuItems.forEach(item => {
                    const label = item.querySelector('label');
                    const text = label.textContent.toLowerCase();
                    item.style.display = text.includes(filterText) ? '' : 'none';
                });
            });
        }
    }

    static async _setupModsControls(appInstance) {
        const toggleAllBtn = document.getElementById('toggleAllBtn');
        const menuItemsControl = document.getElementById('menuItemsControl');
        
        if (toggleAllBtn && menuItemsControl) {
            toggleAllBtn.textContent = appInstance.allModsVisible ? 'Hide All' : 'Show All';
            toggleAllBtn.addEventListener('click', () => appInstance.toggleAllMods());
            
            const modsHtml = appInstance.mods.map(m => `
                <div class="menu-item-toggle">
                    <input 
                        type="checkbox" 
                        id="toggle-${m.folder}"
                        ${appInstance.modVisibility[m.folder] ? 'checked' : ''}
                        ${m.folder === 'mods' ? 'disabled' : ''}
                    >
                    <label for="toggle-${m.folder}" ${m.folder === 'mods' ? 'class="mods-label"' : ''}>
                        ${m.name}
                        ${m.folder === 'mods' ? '<span class="mods-note">(always visible)</span>' : ''}
                    </label>
                </div>
            `).join('');
            
            menuItemsControl.innerHTML = modsHtml;
            
            appInstance.mods.forEach(m => {
                if (m.folder !== 'mods') {
                    const checkbox = document.getElementById(`toggle-${m.folder}`);
                    if (checkbox) {
                        checkbox.addEventListener('change', () => {
                            appInstance.modVisibility[m.folder] = checkbox.checked;
                            appInstance.updateModVisibility(m.folder);
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

module.exports = UIManager; 