// Plugin is loaded into global scope, no imports needed
const aboutMod = {
    name: 'About',
    styles: ['styles.css'],
    render: () => `
        <div class="about">
            <h2>Power Eagle</h2>
            <p>
                This is a plugin for power users and developers and can be easily extended to do more.
            </p>
            <div class="status-info">
                <h3>Real-time Status</h3>
                <p id="about-library-status">Current Library: Waiting for change...</p>
                <p id="about-selected-items-status">Selected Items: None</p>
                <p id="about-selected-folder-status">Selected Folder: None</p>
            </div>
        </div>
    `,
    mount: async (container) => {
        // Initialize status on mount
        updateLibraryStatus(eagle.library.path);
        
        try {
            const [initialFolder, initialItems] = await Promise.all([
                eagle.folder.getSelected(),
                eagle.item.getSelected()
            ]);
            
            console.log('Initial folder:', initialFolder);
            updateFolderStatus(initialFolder);
            updateItemsStatus(initialItems);
        } catch (error) {
            console.error('Failed to initialize About mod status:', error);
        }
        
        return () => {};
    },
    
    // Event handlers with safe DOM updates
    onLibraryChanged: (newPath, oldPath) => {
        updateLibraryStatus(newPath);
    },

    onItemSelected: (newItems, oldItems) => {
        updateItemsStatus(newItems);
    },

    onFolderSelected: (newFolder, oldFolder) => {
        console.log('Folder selected:', {
            new: newFolder ? { id: newFolder.id, name: newFolder.name } : null,
            old: oldFolder ? { id: oldFolder.id, name: oldFolder.name } : null
        });
        updateFolderStatus(newFolder);
    }
};

// Helper functions for safe DOM updates
function updateLibraryStatus(path) {
    const element = document.getElementById('about-library-status');
    if (element) {
        element.textContent = `Current Library: ${path || 'None'}`;
    }
}

function updateItemsStatus(items) {
    const element = document.getElementById('about-selected-items-status');
    if (element) {
        const count = items?.length || 0;
        const itemNames = items?.map(item => item.name).join(', ');
        element.textContent = `Selected Items: ${count > 0 ? `${count} (${itemNames})` : 'None'}`;
    }
}

function updateFolderStatus(folder) {
    const element = document.getElementById('about-selected-folder-status');
    if (element) {
        const folderInfo = folder ? `${folder.name} (${folder.icon})` : 'None';
        element.textContent = `Selected Folder: ${folderInfo}`;
        
        if (folder) {
            console.log('Updated folder status:', {
                id: folder.id,
                name: folder.name
            });
        }
    }
}

module.exports = aboutMod;
