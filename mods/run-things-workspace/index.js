const SingleItemHandler = require('./single-item-handler');

let singleItemHandler = null;

module.exports = {
    name: 'Run Things Workspace',
    styles: ['styles.css', "styles/script-filter.css"],
    render: () => `
        <div class="run-things-workspace">
            <div id="selection-message" class="selection-message hidden">
                Only single item selection can use this mod
            </div>
            <div id="single-item-view"></div>
        </div>
    `,
    mount: (container) => {
        // Create a single instance that will be reused
        singleItemHandler = new SingleItemHandler(eagle);
        
        // Initialize with current selection
        eagle.item.getSelected().then(items => {
            handleItemSelection(items);
            // Initialize event listeners after content is rendered
            setTimeout(() => {
                singleItemHandler.initializeEventListeners();
                console.log('Event listeners initialized after render');
            }, 0);
        });

        // Return cleanup function
        return () => {
            if (singleItemHandler) {
                singleItemHandler.cleanup();
                singleItemHandler = null;
            }
        };
    },

    onItemSelected: (newItems, oldItems) => {
        handleItemSelection(newItems);
        // Initialize event listeners after content is rendered
        setTimeout(() => {
            singleItemHandler.initializeEventListeners();
            console.log('Event listeners initialized after selection change');
        }, 0);
    }
};

function handleItemSelection(items) {
    if (!singleItemHandler) return;
    
    const messageElement = document.getElementById('selection-message');
    const singleItemView = document.getElementById('single-item-view');
    
    if (!items || items.length === 0) {
        singleItemHandler.selectedRunItem = null;
        messageElement.classList.add('hidden');
        singleItemView.innerHTML = singleItemHandler.render(null);
    } else if (items.length === 1) {
        singleItemHandler.selectedRunItem = items[0];
        messageElement.classList.add('hidden');
        singleItemView.innerHTML = singleItemHandler.render(items[0]);
    } else {
        singleItemHandler.selectedRunItem = null;
        messageElement.classList.remove('hidden');
        singleItemView.innerHTML = '';
    }
}
