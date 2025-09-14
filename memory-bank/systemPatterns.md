# System Patterns: Power Eagle Meta Plugin System

## Architecture Overview
```
App.tsx → ExtensionManager → [PluginDiscovery, PluginLoader, PluginExecutor, PluginManagement, PluginDownload]
```

## Core Patterns

### Plugin Execution Flow
1. **Discovery**: Scan `~user/.powereagle/extensions/` for installed plugins
2. **Loading**: Load plugin code from `main.js` or built-in examples
3. **Execution**: Run in isolated context with `{eagle, powersdk}` injection
4. **Management**: Handle removal, hiding, and cleanup

### Context Object Pattern
```typescript
const context = {
  eagle: window.eagle,           // Native Eagle API
  powersdk: {
    // Core functionality
    storage: createPluginStorage(pluginId),    // Prefixed localStorage
    container: createPluginContainer(pluginId), // Isolated DOM element
    pluginId,                                  // Plugin identifier
    
    // Organized namespaces
    visual: {
      Button: class,              // Interactive button component
      CardManager: class,         // Rich card UI component
      Dialog: class              // Modal dialog component
    },
    
    utils: {
      files: { createFile, extractZip, listZipContents, formatBytes },
      paths: { getUserHomeDirectory, getExtensionsPath, getDownloadPath, ... },
      dom: { createElement, addStylesheet, waitForElement, copyToClipboard, ... },
      common: { debounce, throttle, generateId, isValidUrl },
      op: { getFolderByName, swapFolderToTag, swapTagToFolder }  // Eagle item/folder operations
    },
    
    webapi: EagleAPI             // Eagle HTTP API client
  }
}
```

### SDK Context Builder Pattern
The `createPowerSDKContext()` function centralizes context creation:

```typescript
// In plugin-executor.ts
const powersdk = await createPowerSDKContext(storage, container, pluginId);
const context = { eagle, powersdk };
```

Benefits:
- **Consistent Structure**: All plugins receive identical organized namespaces
- **Lazy Loading**: Utils modules loaded dynamically when needed
- **Type Safety**: TypeScript support throughout
- **Discoverability**: Clear namespace hierarchy (`powersdk.visual.Button`, `powersdk.utils.files.createFile`)

### Isolation Strategy
- **DOM**: Each plugin gets `plugin-container-{id}` element
- **Storage**: Keys prefixed with `{pluginId}_`
- **Events**: Tracked and cleaned up on plugin switch
- **Context**: Fresh context object per execution

### Plugin Interface
```typescript
// Universal signature for all plugins
export const plugin = async (context: any) => {
  const { eagle, powersdk } = context;
  
  // Modern namespace usage (recommended)
  const dialog = new powersdk.visual.Dialog();
  const success = await powersdk.utils.files.createFile('example', 'txt', 'content');
  powersdk.storage.set('key', 'value');
  
  // Plugin implementation using organized namespaces
}
```

### Download & Installation Flow
1. **Validation**: Check URL ends with `.zip`
2. **Download**: Fetch to `{user}/.powereagle/download/new.zip`
3. **Extract**: Use system APIs (PowerShell/unzip)
4. **Validate**: Check for `plugin.json` and `main.js`
5. **Install**: Move to `{user}/.powereagle/extensions/{pluginId}/`
6. **Cleanup**: Remove zip file, trigger rescan

### Component Responsibilities
- **PluginDiscovery**: File system scanning, URL downloading
- **PluginLoader**: Code loading from files/examples
- **PluginExecutor**: Context creation, isolated execution
- **PluginManagement**: Removal, hiding, cleanup
- **PluginDownload**: Zip handling, validation, installation
- **RootListeners**: Eagle state monitoring with configurable event types and optimized polling
- **Operation Utilities (op.ts)**: Eagle folder/tag conversion operations with batch processing

### Error Handling
- **Plugin Execution**: Try-catch with user notifications
- **File Operations**: Graceful fallbacks
- **Zip Operations**: System command error handling
- **UI State**: Element existence validation

## Eagle State Monitoring Patterns

### RootListeners Enhanced Capabilities
The `RootListeners` class provides sophisticated Eagle application state monitoring:

```typescript
// Targeted monitoring for specific event types
await rootListeners.startItemMonitoring(1000);     // Only item selection changes
await rootListeners.startFolderMonitoring(1000);   // Only folder selection changes
await rootListeners.startLibraryMonitoring(1000);  // Only library changes
await rootListeners.startSelectionMonitoring(1000); // Items + folders (common case)

// Full monitoring with custom event types
await rootListeners.startPolling(1000, ['itemChange', 'folderChange']);

// Register callbacks for specific events
rootListeners.registerCallback('itemChange', (selectedItemIds) => {
  console.log('Selected items changed:', selectedItemIds);
});

rootListeners.registerCallback('folderChange', (selectedFolderIds) => {
  console.log('Selected folders changed:', selectedFolderIds);
});
```

**Key Features**:
- **Selective Monitoring**: Choose which Eagle state changes to track for performance
- **Sorted Comparisons**: Arrays are sorted for consistent change detection
- **Error Recovery**: Automatic cleanup of failed callbacks
- **Callback Statistics**: Track registered callback counts by event type

## Eagle Item Operation Patterns

### Folder/Tag Conversion Utilities
The `op.ts` module provides batch operations for Eagle item organization:

```typescript
import { getFolderByName, swapFolderToTag, swapTagToFolder } from './utils/op';

// Find folder by name
const folder = await getFolderByName('MyFolder', eagle);

// Convert folder organization to tags (removes from folder, adds folder name as tag)
const result = await swapFolderToTag(folder, selectedItems, eagle);
console.log(`Processed ${result.processedCount} items, errors: ${result.errors.length}`);

// Convert tag organization to folder (removes tag, adds to folder with tag name)
const result = await swapTagToFolder('MyTag', selectedItems, eagle);
console.log(`Created/used folder: ${result.folder?.name}, processed: ${result.processedCount}`);
```

**Key Features**:
- **Batch Processing**: Handle multiple selected items efficiently
- **Error Tracking**: Individual item errors don't stop the batch operation
- **Folder Creation**: Auto-creates folders when converting tags to folders
- **Progress Reporting**: Returns processed counts and detailed error information
- **Data Integrity**: Uses fresh item data and saves changes properly