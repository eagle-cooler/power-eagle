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
    storage: createPluginStorage(pluginId),    // Prefixed localStorage
    container: createPluginContainer(pluginId), // Isolated DOM element
    CardManager,                               // UI component
    webapi,                                   // Eagle HTTP API client
    pluginId                                  // Plugin identifier
  }
}
```

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
  const { storage, container, CardManager, webapi } = powersdk;
  // Plugin implementation
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

### Error Handling
- **Plugin Execution**: Try-catch with user notifications
- **File Operations**: Graceful fallbacks
- **Zip Operations**: System command error handling
- **UI State**: Element existence validation