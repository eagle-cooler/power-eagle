const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class PluginManifestEditor {
    constructor() {
        this.currentManifest = this.getDefaultManifest();
        this.selectedDirectory = null;
    }

    getDefaultManifest() {
        return {
            name: '',
            uuid: uuidv4(),
            platform: 'all',
            arch: 'all',
            version: '1.0.0',
            keywords: [],
            i18n: false,
            languages: ['en'],
            fallbackLanguage: 'en',
            preview: {}
        };
    }

    async loadManifest(directoryPath) {
        try {
            const manifestPath = path.join(directoryPath, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                const content = fs.readFileSync(manifestPath, 'utf8');
                this.currentManifest = JSON.parse(content);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load manifest:', error);
            return false;
        }
    }

    async saveManifest(directoryPath) {
        try {
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath, { recursive: true });
            }
            const manifestPath = path.join(directoryPath, 'manifest.json');
            fs.writeFileSync(manifestPath, JSON.stringify(this.currentManifest, null, 4));
            return true;
        } catch (error) {
            console.error('Failed to save manifest:', error);
            return false;
        }
    }
}

module.exports = {
    name: 'Plugin Manifest Editor (WIP)',
    styles: ['styles.css'],
    render: () => `
        <div class="plugin-editor">
            <div class="editor-actions">
                <button id="select-directory" class="primary-button">Select Directory</button>
                <button id="save-manifest" class="primary-button" disabled>Generate Plugin</button>
            </div>

            <div class="editor-section template-repo">
                <h2>Template Repository</h2>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="use-template" checked>
                        Use Template Repository
                    </label>
                </div>
                <div class="form-group">
                    <label for="template-url">Repository URL</label>
                    <input type="text" id="template-url" value="https://github.com/eagle-cooler/eagle-skeleton.git">
                </div>
            </div>

            <div class="editor-section basic-info">
                <h2>Basic Information</h2>
                <div class="form-group">
                    <label for="plugin-name">Plugin Name</label>
                    <input type="text" id="plugin-name" placeholder="Enter plugin name">
                </div>
                <div class="form-group">
                    <label for="plugin-uuid">UUID</label>
                    <div class="uuid-container">
                        <input type="text" id="plugin-uuid" readonly>
                        <button id="toggle-uuid-edit" title="Toggle manual edit">🔒</button>
                        <button id="generate-uuid" title="Generate new UUID">🔄</button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="plugin-platform">Platform</label>
                    <input type="text" id="plugin-platform" value="all">
                </div>
                <div class="form-group">
                    <label for="plugin-arch">Architecture</label>
                    <input type="text" id="plugin-arch" value="all">
                </div>
                <div class="form-group">
                    <label for="plugin-keywords">Keywords</label>
                    <input type="text" id="plugin-keywords" placeholder="Comma-separated keywords">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="enable-i18n"> Enable i18n Support
                    </label>
                </div>
            </div>

            <div id="i18n-section" class="editor-section i18n-settings hidden">
                <h2>i18n Settings</h2>
                <div class="form-group">
                    <label for="fallback-language">Fallback Language</label>
                    <input type="text" id="fallback-language" value="en">
                </div>
                <div class="form-group">
                    <label for="languages">Languages</label>
                    <input type="text" id="languages" placeholder="Comma-separated language codes">
                </div>
            </div>

            <div class="editor-section window-settings">
                <h2>Window Settings (Optional)</h2>
                <div class="form-group">
                    <label>Type</label>
                    <select id="window-type">
                        <option value="none" selected>None</option>
                        <option value="window">Window</option>
                        <option value="service">Service</option>
                    </select>
                </div>
                <div id="window-settings-form" style="display: none;">
                    <div class="form-group">
                        <label for="window-url">URL</label>
                        <input type="text" id="window-url" value="index.html">
                    </div>
                    <div class="form-row">
                        <div class="form-group half">
                            <label for="window-width">Width</label>
                            <input type="number" id="window-width" value="640">
                        </div>
                        <div class="form-group half">
                            <label for="window-height">Height</label>
                            <input type="number" id="window-height" value="480">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group half">
                            <label for="window-min-width">Min Width</label>
                            <input type="number" id="window-min-width" value="640">
                        </div>
                        <div class="form-group half">
                            <label for="window-min-height">Min Height</label>
                            <input type="number" id="window-min-height" value="480">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group half">
                            <label for="window-max-width">Max Width</label>
                            <input type="number" id="window-max-width" value="640">
                        </div>
                        <div class="form-group half">
                            <label for="window-max-height">Max Height</label>
                            <input type="number" id="window-max-height" value="480">
                        </div>
                    </div>
                    <div class="window-flags">
                        <label><input type="checkbox" id="window-always-on-top"> Always on Top</label>
                        <label><input type="checkbox" id="window-frame" checked> Show Frame</label>
                        <label><input type="checkbox" id="window-fullscreenable" checked> Fullscreenable</label>
                        <label><input type="checkbox" id="window-maximizable" checked> Maximizable</label>
                        <label><input type="checkbox" id="window-minimizable" checked> Minimizable</label>
                        <label><input type="checkbox" id="window-resizable" checked> Resizable</label>
                        <label><input type="checkbox" id="window-multiple"> Allow Multiple</label>
                        <label><input type="checkbox" id="window-run-after-install"> Run After Install</label>
                    </div>
                    <div class="form-group">
                        <label for="window-background">Background Color</label>
                        <input type="color" id="window-background" value="#ffffff">
                    </div>
                </div>
            </div>

            <div class="editor-section preview-settings">
                <h2>Preview Settings</h2>
                <div id="preview-formats">
                    <!-- Format entries will be added here -->
                </div>
                <button id="add-format" class="add-button">+ Add Format</button>
            </div>
        </div>
    `,

    mount: (container) => {
        const editor = new PluginManifestEditor();
        let uuidLocked = true;

        function updateUI(manifest) {
            document.getElementById('plugin-name').value = manifest.name;
            document.getElementById('plugin-uuid').value = manifest.uuid;
            document.getElementById('plugin-platform').value = manifest.platform;
            document.getElementById('plugin-arch').value = manifest.arch;
            document.getElementById('plugin-keywords').value = manifest.keywords.join(', ');
            document.getElementById('enable-i18n').checked = manifest.i18n;
            
            const i18nSection = document.getElementById('i18n-section');
            if (manifest.i18n) {
                i18nSection.classList.remove('hidden');
                document.getElementById('fallback-language').value = manifest.fallbackLanguage;
                document.getElementById('languages').value = manifest.languages.join(', ');
            } else {
                i18nSection.classList.add('hidden');
            }

            // Window settings
            const windowType = document.getElementById('window-type');
            const windowForm = document.getElementById('window-settings-form');
            
            if (manifest.main) {
                windowType.value = 'window';
                windowForm.style.display = 'block';
                document.getElementById('window-url').value = manifest.main.url;
                document.getElementById('window-width').value = manifest.main.width;
                document.getElementById('window-height').value = manifest.main.height;
                document.getElementById('window-min-width').value = manifest.main.minWidth;
                document.getElementById('window-min-height').value = manifest.main.minHeight;
                document.getElementById('window-max-width').value = manifest.main.maxWidth;
                document.getElementById('window-max-height').value = manifest.main.maxHeight;
                document.getElementById('window-always-on-top').checked = manifest.main.alwaysOnTop;
                document.getElementById('window-frame').checked = manifest.main.frame;
                document.getElementById('window-fullscreenable').checked = manifest.main.fullscreenable;
                document.getElementById('window-maximizable').checked = manifest.main.maximizable;
                document.getElementById('window-minimizable').checked = manifest.main.minimizable;
                document.getElementById('window-resizable').checked = manifest.main.resizable;
                document.getElementById('window-multiple').checked = manifest.main.multiple;
                document.getElementById('window-run-after-install').checked = manifest.main.runAfterInstall;
                document.getElementById('window-background').value = manifest.main.backgroundColor;
            } else {
                windowType.value = 'none';
                windowForm.style.display = 'none';
            }

            // Preview formats
            renderPreviewFormats(manifest.preview);
        }

        function renderPreviewFormats(preview) {
            const container = document.getElementById('preview-formats');
            container.innerHTML = '';

            Object.entries(preview).forEach(([format, config]) => {
                container.appendChild(createFormatEntry(format, config));
            });
        }

        function createFormatEntry(format, config) {
            const entry = document.createElement('div');
            entry.className = 'format-entry';
            entry.innerHTML = `
                <div class="format-header">
                    <input type="text" class="format-name" value="${format}" placeholder="Format (e.g., jpg,png)">
                    <button class="remove-format">×</button>
                </div>
                <div class="format-type-selector">
                    <label><input type="radio" name="format-type-${format}" value="viewer" ${config.viewer ? 'checked' : ''}> Viewer</label>
                    <label><input type="radio" name="format-type-${format}" value="thumbnail" ${config.thumbnail ? 'checked' : ''}> Thumbnail</label>
                    <label><input type="radio" name="format-type-${format}" value="inspector" ${config.inspector ? 'checked' : ''}> Inspector</label>
                </div>
                <div class="format-config">
                    <!-- Config fields will be added based on type -->
                </div>
            `;

            // Add event listeners
            entry.querySelector('.remove-format').addEventListener('click', () => entry.remove());
            entry.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', (e) => updateFormatConfig(entry, e.target.value));
            });

            // Initialize with current config
            const type = config.viewer ? 'viewer' : config.thumbnail ? 'thumbnail' : 'inspector';
            updateFormatConfig(entry, type, config[type]);

            return entry;
        }

        function updateFormatConfig(entry, type, config = {}) {
            const configContainer = entry.querySelector('.format-config');
            let html = '';

            switch (type) {
                case 'viewer':
                    html = `
                        <div class="form-group">
                            <label>Path</label>
                            <input type="text" class="viewer-path" value="${config.path || 'viewer/index.html'}">
                        </div>
                    `;
                    break;

                case 'thumbnail':
                    html = `
                        <div class="form-group">
                            <label>Path</label>
                            <input type="text" class="thumbnail-path" value="${config.path || 'thumbnail/index.js'}">
                        </div>
                        <div class="form-group">
                            <label>Size</label>
                            <input type="number" class="thumbnail-size" value="${config.size || 400}">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" class="thumbnail-zoom" ${config.allowZoom ? 'checked' : ''}>
                                Allow Zoom
                            </label>
                        </div>
                    `;
                    break;

                case 'inspector':
                    html = `
                        <div class="form-group">
                            <label>Path</label>
                            <input type="text" class="inspector-path" value="${config.path || 'index.html'}">
                        </div>
                        <div class="form-group">
                            <label>Height</label>
                            <input type="number" class="inspector-height" value="${config.height || 100}">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" class="inspector-multiselect" ${config.multiSelect ? 'checked' : ''}>
                                Multi Select
                            </label>
                        </div>
                    `;
                    break;
            }

            configContainer.innerHTML = html;
        }

        function gatherFormData() {
            const manifest = editor.getDefaultManifest();

            manifest.name = document.getElementById('plugin-name').value;
            manifest.uuid = document.getElementById('plugin-uuid').value;
            manifest.platform = document.getElementById('plugin-platform').value;
            manifest.arch = document.getElementById('plugin-arch').value;
            manifest.keywords = document.getElementById('plugin-keywords').value
                .split(',')
                .map(k => k.trim())
                .filter(k => k);

            manifest.i18n = document.getElementById('enable-i18n').checked;
            if (manifest.i18n) {
                manifest.fallbackLanguage = document.getElementById('fallback-language').value;
                manifest.languages = document.getElementById('languages').value
                    .split(',')
                    .map(l => l.trim())
                    .filter(l => l);
            }

            // Window settings
            if (document.getElementById('window-type').value === 'window') {
                manifest.main = {
                    url: document.getElementById('window-url').value,
                    width: parseInt(document.getElementById('window-width').value),
                    height: parseInt(document.getElementById('window-height').value),
                    minWidth: parseInt(document.getElementById('window-min-width').value),
                    minHeight: parseInt(document.getElementById('window-min-height').value),
                    maxWidth: parseInt(document.getElementById('window-max-width').value),
                    maxHeight: parseInt(document.getElementById('window-max-height').value),
                    alwaysOnTop: document.getElementById('window-always-on-top').checked,
                    frame: document.getElementById('window-frame').checked,
                    fullscreenable: document.getElementById('window-fullscreenable').checked,
                    maximizable: document.getElementById('window-maximizable').checked,
                    minimizable: document.getElementById('window-minimizable').checked,
                    resizable: document.getElementById('window-resizable').checked,
                    backgroundColor: document.getElementById('window-background').value,
                    multiple: document.getElementById('window-multiple').checked,
                    runAfterInstall: document.getElementById('window-run-after-install').checked
                };
            } else {
                delete manifest.main;
            }

            // Preview formats
            manifest.preview = {};
            document.querySelectorAll('.format-entry').forEach(entry => {
                const format = entry.querySelector('.format-name').value;
                const type = entry.querySelector('input[type="radio"]:checked').value;
                const config = {};

                switch (type) {
                    case 'viewer':
                        config.viewer = {
                            path: entry.querySelector('.viewer-path').value
                        };
                        break;

                    case 'thumbnail':
                        config.thumbnail = {
                            path: entry.querySelector('.thumbnail-path').value,
                            size: parseInt(entry.querySelector('.thumbnail-size').value),
                            allowZoom: entry.querySelector('.thumbnail-zoom').checked
                        };
                        break;

                    case 'inspector':
                        config.inspector = {
                            path: entry.querySelector('.inspector-path').value,
                            height: parseInt(entry.querySelector('.inspector-height').value),
                            multiSelect: entry.querySelector('.inspector-multiselect').checked
                        };
                        break;
                }

                manifest.preview[format] = config;
            });

            return manifest;
        }

        // Event Listeners
        document.getElementById('toggle-uuid-edit').addEventListener('click', () => {
            const uuidInput = document.getElementById('plugin-uuid');
            uuidLocked = !uuidLocked;
            uuidInput.readOnly = uuidLocked;
            document.getElementById('toggle-uuid-edit').textContent = uuidLocked ? '🔒' : '🔓';
        });

        document.getElementById('generate-uuid').addEventListener('click', () => {
            document.getElementById('plugin-uuid').value = uuidv4();
        });

        document.getElementById('enable-i18n').addEventListener('change', (e) => {
            document.getElementById('i18n-section').classList.toggle('hidden', !e.target.checked);
        });

        document.getElementById('window-type').addEventListener('change', (e) => {
            const form = document.getElementById('window-settings-form');
            form.style.display = e.target.value === 'window' ? 'block' : 'none';
        });

        document.getElementById('add-format').addEventListener('click', () => {
            const container = document.getElementById('preview-formats');
            container.appendChild(createFormatEntry('format', { viewer: { path: 'viewer/index.html' } }));
        });

        document.getElementById('select-directory').addEventListener('click', async () => {
            const result = await eagle.dialog.showOpenDialog({
                properties: ['openDirectory', 'createDirectory']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                editor.selectedDirectory = result.filePaths[0];
                document.getElementById('save-manifest').disabled = false;

                // Try to load existing manifest
                if (await editor.loadManifest(editor.selectedDirectory)) {
                    updateUI(editor.currentManifest);
                }
            }
        });

        document.getElementById('use-template').addEventListener('change', (e) => {
            document.getElementById('template-url').disabled = !e.target.checked;
        });

        document.getElementById('save-manifest').addEventListener('click', async () => {
            if (!editor.selectedDirectory) return;

            const useTemplate = document.getElementById('use-template').checked;
            const templateUrl = document.getElementById('template-url').value;

            if (useTemplate) {
                // TODO: Implement template cloning
                eagle.dialog.showMessageBox({
                    type: 'info',
                    message: 'Template cloning not yet implemented'
                });
                return;
            }

            editor.currentManifest = gatherFormData();
            if (await editor.saveManifest(editor.selectedDirectory)) {
                eagle.dialog.showMessageBox({
                    type: 'info',
                    message: 'Plugin generated successfully'
                });
            }
        });

        // Initialize UI
        updateUI(editor.currentManifest);
    }
};
