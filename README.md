
# Example Script for `Run Things Workspace`
```js
/**
 * Example script that demonstrates the available features
 * This script will be run when the ▶️ button is clicked
 */

module.exports = {
    /**
     * Optional filter function that determines if this script should be shown for an item
     * @param {Object} item - The item to check
     * @param {string} itemPath - The full path to the item
     * @returns {boolean} - True if the script should be shown, false otherwise
     */
    filter: function(item) {
        const itemPath = item.filePath;
        // Example: Only show for items with specific extensions
        return itemPath.endsWith('.jpg') || itemPath.endsWith('.png');
        
        // Example: Only show for items in specific folders
        // return itemPath.includes('photos') || itemPath.includes('images');
        
        // Example: Only show for items with specific names
        // return item.name.startsWith('IMG_');
        
        // Example: Complex conditions
        // return item.name.match(/^\d{8}_/) && itemPath.includes('photos');
    },

    /**
     * @param {Object} params
     * @param {Object} params.eagle - The eagle application instance
     * @param {Object} params.item - The currently selected item
     * @param {string} params.itemPath - The full path to the selected item
     */
    run: async function({ eagle, item, itemPath }) {
        // Example: Show a confirmation dialog
        const { response } = await eagle.dialog.showMessageBox({
            type: 'question',
            buttons: ['Cancel', 'Continue'],
            title: 'Example Script',
            message: 'Do you want to run this example?',
            detail: `Selected item: ${item.name}`
        });

        if (response !== 1) return; // User clicked Cancel

        // Example: Access the item's runThingsFiles directory
        const path = require('path');
        const fs = require('fs');
        const runThingsPath = path.join(path.dirname(itemPath), 'runThingsFiles');

        // Example: Create a new file in the runThingsFiles directory
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newFilePath = path.join(runThingsPath, `example-${timestamp}.txt`);
        
        try {
            fs.writeFileSync(newFilePath, `This file was created by the example script\nItem: ${item.name}\nTime: ${new Date().toLocaleString()}`);
            
            // Show success message
            await eagle.dialog.showMessageBox({
                type: 'info',
                message: 'Script completed successfully',
                detail: `Created file: ${path.basename(newFilePath)}`
            });

            // Open the file
            eagle.shell.openPath(newFilePath);
        } catch (error) {
            // Show error message if something goes wrong
            await eagle.dialog.showErrorBox(
                'Script Error',
                `Failed to create file: ${error.message}`
            );
        }
    }
}; 
```
