const SingleItemHandler = require('./single-item-handler');

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
        const singleItemHandler = new SingleItemHandler(eagle);
        
        // Initialize with current selection
        eagle.item.getSelected().then(items => {
            handleItemSelection(items, singleItemHandler);
            // Initialize event listeners after content is rendered
            setTimeout(() => {
                singleItemHandler.initializeEventListeners();
                console.log('Event listeners initialized after render');
            }, 0);
        });

    },

    onItemSelected: (newItems, oldItems) => {
        const singleItemHandler = new SingleItemHandler(eagle);
        handleItemSelection(newItems, singleItemHandler);
        // Initialize event listeners after content is rendered
        setTimeout(() => {
            singleItemHandler.initializeEventListeners();
            console.log('Event listeners initialized after selection change');
        }, 0);
    }
};

function handleItemSelection(items, handler) {
    const messageElement = document.getElementById('selection-message');
    const singleItemView = document.getElementById('single-item-view');
    
    if (!items || items.length === 0) {
        handler.selectedRunItem = null;
        messageElement.classList.add('hidden');
        singleItemView.innerHTML = handler.render(null);
    } else if (items.length === 1) {
        handler.selectedRunItem = items[0];
        messageElement.classList.add('hidden');
        singleItemView.innerHTML = handler.render(items[0]);
    } else {
        handler.selectedRunItem = null;
        messageElement.classList.remove('hidden');
        singleItemView.innerHTML = '';
    }
}
