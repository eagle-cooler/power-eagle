const fs = require('fs');
const path = require('path');
const os = require('os');

let copyMode = true;

class SingleItemHandler {
    constructor(eagle) {
        this.eagle = eagle;
        this.runScriptsPath = path.join(os.homedir(), 'eaglercooler', 'runscripts');
        this.selectedRunItem = null;
        this.clickHandler = this.handleClick.bind(this);
        this.searchHandler = this.handleSearch.bind(this);
        
        // Bind drag and drop handlers
        this.handleDocumentDragOver = this.handleDocumentDragOver.bind(this);
        this.handleDocumentDrop = this.handleDocumentDrop.bind(this);
        this.handleContainerDragEnter = this.handleContainerDragEnter.bind(this);
        this.handleContainerDragOver = this.handleContainerDragOver.bind(this);
        this.handleContainerDragLeave = this.handleContainerDragLeave.bind(this);
        this.handleContainerDrop = this.handleContainerDrop.bind(this);
    }

    renderScripts(selectedItem) {
        if (!fs.existsSync(this.runScriptsPath)) {
            fs.mkdirSync(this.runScriptsPath, { recursive: true });
            return '<div class="no-scripts">No scripts available</div>';
        }

        const scripts = fs.readdirSync(this.runScriptsPath)
            .filter(file => file.endsWith('.js') || file.endsWith('.sh'))
            .filter(script => {
                // Only apply filter for .js files
                if (!script.endsWith('.js')) return true;
                
                try {
                    const scriptPath = path.join(this.runScriptsPath, script);
                    const scriptModule = require(scriptPath);
                    
                    // If the script has a filter function, use it
                    if (typeof scriptModule.filter === 'function') {
                        return scriptModule.filter(selectedItem);
                    }
                    
                    // No filter function means show the script
                    return true;
                } catch (error) {
                    console.error(`Failed to load script ${script}:`, error);
                    return false; // Hide scripts that fail to load
                }
            });

        if (scripts.length === 0) {
            return '<div class="no-scripts">No scripts available</div>';
        }

        const scriptsList = scripts.map(script => {
            const scriptPath = path.join(this.runScriptsPath, script);
            
            return `
                <div class="script-item" data-script-path="${scriptPath}" data-script-name="${script}">
                    <div class="script-header">
                        <span class="script-name">${script}</span>
                    </div>
                    <div class="script-actions">
                        <button class="action-btn run-script" title="Run script">▶️</button>
                        <button class="action-btn edit-script" title="Edit script">✎</button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="search-bar">
                <input type="text" id="script-search" placeholder="Search scripts..." class="script-search-input">
            </div>
            <div class="scripts-content">
                ${scriptsList}
            </div>
        `;
    }

    render(selectedItem) {
        if (!selectedItem || !selectedItem.filePath) {
            return '<div class="no-selection">No item selected or invalid item</div>';
        }

        const fileName = selectedItem.name || path.basename(selectedItem.filePath);
        const itemId = selectedItem.id || path.basename(selectedItem.filePath, path.extname(selectedItem.filePath));

        return `
            <div class="single-item-container">
                <div class="selected-item-info" data-item-id="${itemId}">
                    <span class="item-name">📄 ${fileName}</span>
                </div>
                <div class="card files-card" id="files-drop-zone">
                    <div class="card-header">
                        <h3>Files</h3>
                        <div class="header-actions">
                            <button class="control-btn cleanup-files" title="Remove runThingsFiles folder">
                                🗑️ Cleanup
                            </button>
                            <button class="control-btn" id="copy-move-toggle">
                                ${copyMode ? "📋 Copy" : "✂️ Move"}
                            </button>
                        </div>
                    </div>
                    <div class="files-list">
                        ${this.renderFiles(selectedItem)}
                    </div>
                </div>
                <div class="card scripts-card">
                    <div class="card-header">
                        <h3>Available Scripts</h3>
                        <div class="header-actions">
                            <button class="control-btn refresh-scripts" title="Refresh Scripts">
                                🔄 Refresh
                            </button>
                            <button class="control-btn open-scripts-folder" title="Open Folder">
                                📁 Open
                            </button>
                        </div>
                    </div>
                    <div class="scripts-list">
                        ${this.renderScripts(selectedItem)}
                    </div>
                </div>
            </div>
        `;
    }

    renderFiles(item) {
        if (!item || !item.filePath) {
            return '<div class="no-files">Invalid item path</div>';
        }

        const dirPath = path.dirname(item.filePath);
        const runThingsFilesPath = path.join(dirPath, 'runThingsFiles');

        if (!fs.existsSync(runThingsFilesPath)) {
            try {
                fs.mkdirSync(runThingsFilesPath, { recursive: true });
            } catch (error) {
                console.error('Failed to create runThingsFiles directory:', error);
                return '<div class="no-files">Failed to create files directory</div>';
            }
            return '<div class="no-files">No files available</div>';
        }

        try {
            const files = fs.readdirSync(runThingsFilesPath)
                .filter(file => {
                    const excluded = ['metadata.json', path.basename(item.filePath), 'itemProp.json'];
                    return !file.startsWith('.') && !excluded.includes(file);
                });

            if (files.length === 0) {
                return '<div class="no-files">No files available</div>';
            }

            return files.map(file => {
                const filePath = path.join(runThingsFilesPath, file);
                return `
                    <div class="file-item" data-file-path="${filePath}">
                        <span class="file-name">${file}</span>
                        <div class="file-actions">
                            <button class="action-btn open-file" title="Open file">📂</button>
                            <button class="action-btn delete-file" title="Delete file">🗑️</button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to read files directory:', error);
            return '<div class="no-files">Failed to read files</div>';
        }
    }

    async handleClick(e) {
        // Script actions - handle these first
        if (e.target.classList.contains('run-script') || e.target.classList.contains('edit-script')) {
            const scriptItem = e.target.closest('.script-item');
            if (!scriptItem) return;

            const scriptPath = scriptItem.dataset.scriptPath;

            if (e.target.classList.contains('edit-script')) {
                this.eagle.shell.openPath(scriptPath);
                return;
            } else if (e.target.classList.contains('run-script')) {
                try {
                    const script = require(scriptPath);
                    if (typeof script.run === 'function') {
                        await script.run({
                            eagle: this.eagle,
                            item: this.selectedRunItem,
                            itemPath: this.selectedRunItem.filePath
                        });
                        
                        // Refresh both files and scripts panels
                        const filesContainer = document.querySelector('.files-list');
                        if (filesContainer) {
                            filesContainer.innerHTML = this.renderFiles(this.selectedRunItem);
                        }
                        
                        this.eagle.dialog.showMessageBox({
                            type: 'info',
                            message: 'Script executed successfully'
                        });
                    } else {
                        throw new Error('Script must export a run function');
                    }
                } catch (error) {
                    console.error('Script execution failed:', error);
                    this.eagle.dialog.showMessageBox({
                        type: 'error',
                        message: 'Script execution failed',
                        detail: error.message
                    });
                }
                return;
            }
        }

        // Item click handler
        const itemInfo = e.target.closest('.selected-item-info');
        if (itemInfo) {
            const itemId = itemInfo.dataset.itemId;
            if (itemId && this.selectedRunItem && this.selectedRunItem.filePath) {
                this.eagle.shell.openPath(this.selectedRunItem.filePath);
            }
            return;
        }

        // Refresh scripts button
        if (e.target.classList.contains('refresh-scripts')) {
            if (!this.selectedRunItem) return;
            
            // Clear require cache for all scripts
            const scriptFiles = fs.readdirSync(this.runScriptsPath)
                .filter(file => file.endsWith('.js'));
            
            for (const script of scriptFiles) {
                const scriptPath = path.join(this.runScriptsPath, script);
                delete require.cache[require.resolve(scriptPath)];
            }
            
            // Update scripts list
            const scriptsContainer = document.querySelector('.scripts-list');
            if (scriptsContainer) {
                scriptsContainer.innerHTML = this.renderScripts(this.selectedRunItem);
            }
            return;
        }

        // Open scripts folder button
        if (e.target.classList.contains('open-scripts-folder')) {
            this.eagle.shell.openPath(this.runScriptsPath);
            return;
        }

        // Cleanup files button
        if (e.target.classList.contains('cleanup-files')) {
            if (!this.selectedRunItem) return;
            
            const dirPath = path.dirname(this.selectedRunItem.filePath);
            const runThingsFilesPath = path.join(dirPath, 'runThingsFiles');
            
            if (fs.existsSync(runThingsFilesPath)) {
                const { response } = await this.eagle.dialog.showMessageBox({
                    type: 'question',
                    buttons: ['Cancel', 'Delete'],
                    title: 'Confirm Cleanup',
                    message: 'Are you sure you want to remove the runThingsFiles folder?',
                    detail: `This will delete all files in: ${runThingsFilesPath}`
                });

                if (response === 1) {
                    try {
                        fs.rmSync(runThingsFilesPath, { recursive: true, force: true });
                        
                        const filesContainer = document.querySelector('.files-list');
                        if (filesContainer) {
                            filesContainer.innerHTML = this.renderFiles(this.selectedRunItem);
                        }
                        
                        this.eagle.dialog.showMessageBox({
                            type: 'info',
                            message: 'Cleanup successful',
                            detail: 'The runThingsFiles folder has been removed'
                        });
                    } catch (error) {
                        console.error('Failed to cleanup files:', error);
                        this.eagle.dialog.showErrorBox('Error', 'Failed to cleanup files: ' + error.message);
                    }
                }
            }
            return;
        }

        // Copy/Move mode toggle
        if (e.target.id === 'copy-move-toggle') {
            copyMode = !copyMode;
            e.target.textContent = copyMode ? '📋 Copy' : '✂️ Move';
            return;
        }

        // File actions
        const fileItem = e.target.closest('.file-item');
        if (!fileItem) return;

        const filePath = fileItem.dataset.filePath;

        if (e.target.classList.contains('open-file')) {
            this.eagle.shell.openPath(filePath);
            return;
        } else if (e.target.classList.contains('delete-file')) {
            const { response } = await this.eagle.dialog.showMessageBox({
                type: 'question',
                buttons: ['Cancel', 'Delete'],
                title: 'Confirm Deletion',
                message: 'Are you sure you want to delete this file?',
                detail: `Path: ${filePath}`
            });

            if (response === 1) {
                fs.unlinkSync(filePath);
                fileItem.remove();
            }
            return;
        }
    }

    handleSearch(e) {
        if (e.target.id === 'script-search') {
            const searchTerm = e.target.value.toLowerCase();
            const scriptItems = document.querySelectorAll('.script-item');
            
            scriptItems.forEach(item => {
                const scriptName = item.dataset.scriptName.toLowerCase();
                if (scriptName.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }
    }

    handleDocumentDragOver(e) {
        e.preventDefault();
    }

    handleDocumentDrop(e) {
        e.preventDefault();
    }

    handleContainerDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        e.target.classList.add('dragover');
    }

    handleContainerDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.target.classList.add('dragover');
    }

    handleContainerDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.target.getBoundingClientRect();
        if (
            e.clientX <= rect.left ||
            e.clientX >= rect.right ||
            e.clientY <= rect.top ||
            e.clientY >= rect.bottom
        ) {
            e.target.classList.remove('dragover');
        }
    }

    async handleContainerDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Find the container and remove dragover class
        const container = e.target.closest('#files-drop-zone');
        if (!container) return;
        container.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (!files.length) return;

        const item = this.selectedRunItem;
        if (!item || !item.filePath) {
            console.error('No valid item selected');
            this.eagle.dialog.showErrorBox('Error', 'No valid item selected');
            return;
        }

        const dirPath = path.dirname(item.filePath);
        const runThingsFilesPath = path.join(dirPath, 'runThingsFiles');

        try {
            if (!fs.existsSync(runThingsFilesPath)) {
                fs.mkdirSync(runThingsFilesPath, { recursive: true });
            }

            for (const file of files) {
                const filePath = file.path;
                const fileName = path.basename(filePath);
                const destPath = path.join(runThingsFilesPath, fileName);

                try {
                    if (copyMode) {
                        fs.copyFileSync(filePath, destPath);
                    } else {
                        fs.renameSync(filePath, destPath);
                    }
                } catch (error) {
                    console.error('File operation failed:', error);
                    this.eagle.dialog.showErrorBox(
                        'Operation Failed',
                        `Couldn't ${copyMode ? 'copy' : 'move'} ${fileName}`
                    );
                }
            }

            // Find the files list within the container
            const filesList = container.querySelector('.files-list');
            if (filesList) {
                filesList.innerHTML = this.renderFiles(item);
            }

            this.eagle.dialog.showMessageBox({
                type: 'info',
                message: 'Files added successfully',
                detail: `${copyMode ? 'Copied' : 'Moved'} ${files.length} file(s) to extended files`
            });
        } catch (error) {
            console.error('Failed to handle dropped files:', error);
            this.eagle.dialog.showErrorBox('Error', 'Failed to add files: ' + error.message);
        }
    }

    initializeEventListeners() {
        // Remove existing event listeners if they exist
        document.removeEventListener('click', this.clickHandler);
        document.removeEventListener('input', this.searchHandler);
        document.removeEventListener('dragover', this.handleDocumentDragOver);
        document.removeEventListener('drop', this.handleDocumentDrop);

        // Add new event listeners
        document.addEventListener('click', this.clickHandler);
        document.addEventListener('input', this.searchHandler);
        document.addEventListener('dragover', this.handleDocumentDragOver);
        document.addEventListener('drop', this.handleDocumentDrop);

        // Initialize drag and drop
        this.initDragDrop();
    }

    initDragDrop() {
        // Try to find the container, with a few retries if needed
        let retryCount = 0;
        const maxRetries = 3;
        const findContainer = () => {
            const container = document.getElementById('files-drop-zone');
            
            if (!container && retryCount < maxRetries) {
                retryCount++;
                setTimeout(findContainer, 100);
                return;
            }
            
            if (!container) {
                console.warn('No files-drop-zone container found after retries!');
                return;
            }

            // Remove existing listeners if they exist
            container.removeEventListener('dragenter', this.handleContainerDragEnter);
            container.removeEventListener('dragover', this.handleContainerDragOver);
            container.removeEventListener('dragleave', this.handleContainerDragLeave);
            container.removeEventListener('drop', this.handleContainerDrop);

            // Add new listeners
            container.addEventListener('dragenter', this.handleContainerDragEnter);
            container.addEventListener('dragover', this.handleContainerDragOver);
            container.addEventListener('dragleave', this.handleContainerDragLeave);
            container.addEventListener('drop', this.handleContainerDrop);
        };

        // Start looking for the container
        findContainer();
    }
}

module.exports = SingleItemHandler; 