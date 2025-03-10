const { ipcMain } = require('electron');

// Set up IPC handlers for ModManager
function setupModManagerIPC() {
    // Handle renderer process registration
    ipcMain.on('register-mod-manager', (event) => {
        // Send current ModManager state to renderer
        if (global.mainModManager) {
            event.reply('mod-manager-update', {
                state: global.mainModManager.state,
                activeMods: Array.from(global.mainModManager.activeMods),
                globalHandlers: serializeHandlers(global.mainModManager.globalHandlers)
            });
        }
    });

    // Handle global handler registration from renderer
    ipcMain.on('register-global-handler', (event, { modId, eventType, handler }) => {
        if (global.mainModManager) {
            global.mainModManager.registerGlobalHandler(modId, eventType, handler);
        }
    });
}

// Helper function to serialize handlers Map for IPC
function serializeHandlers(handlersMap) {
    const serialized = {};
    for (const [modId, handlers] of handlersMap) {
        serialized[modId] = {};
        for (const [eventType, handlerSet] of handlers) {
            serialized[modId][eventType] = Array.from(handlerSet);
        }
    }
    return serialized;
}

module.exports = { setupModManagerIPC }; 