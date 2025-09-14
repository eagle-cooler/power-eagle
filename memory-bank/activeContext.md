# Active Context: Power Eagle Meta Plugin System

## Current State: **COMPLETE & ENHANCED WITH PYTHON SCRIPT SUPPORT**

### Recent Accomplishments
- ✅ **Plugin Download System**: Real URL downloading with zip validation using system APIs
- ✅ **System API Integration**: PowerShell (Windows) and unzip (macOS) for zip extraction
- ✅ **Modular Architecture**: Split into focused components (discovery, loader, executor, management, download)
- ✅ **Universal Plugin Interface**: All plugins use `plugin(context)` with `{eagle, powersdk}` destructuring
- ✅ **Organized Namespace Structure**: `powersdk.visual.Button`, `powersdk.utils.files.createFile`, `powersdk.storage.set/get`
- ✅ **SDK Context Builder**: `createPowerSDKContext()` function provides structured imports
- ✅ **TypeScript Conversion**: Converted webapi.js to webapi.ts with proper types
- ✅ **Code Cleanup**: Removed unused functions and fixed all syntax errors
- ✅ **Enhanced Plugin Examples**: All examples demonstrate organized import patterns
- ✅ **Python Script Plugin Support**: New plugin type with Eagle state monitoring and context passing
- ✅ **Eagle Item/Folder Operation Utilities**: New `op.ts` module with folder-to-tag and tag-to-folder swap operations
- ✅ **Enhanced Root Listeners**: Improved Eagle state monitoring with targeted event types and better change detection

### Architecture Components
- **PluginDiscovery**: Scans installed plugins, downloads from URLs
- **PluginLoader**: Loads plugin code from files/examples
- **PluginExecutor**: Executes JavaScript plugins in isolated contexts
- **PythonScriptRunner**: Executes Python scripts with Eagle context integration
- **PluginManagement**: Handles plugin removal/hiding
- **PluginDownload**: Downloads and validates zip files using system APIs
- **RootListeners**: Eagle application state monitoring with polling-based change detection and targeted event filtering
- **Operation Utilities (op.ts)**: Eagle folder/tag conversion utilities for item organization workflows

### Plugin Types Supported
1. **JavaScript Plugins** (`"type": "plugin"`): Traditional userscript plugins with SDK access
2. **Python Scripts** (`"type": "python-script"`): Python scripts with Eagle context via environment variables

### Python Script Features
- **Eagle Context Integration**: Full selected folders, items, and library info passed as JSON via `POWEREAGLE_CONTEXT` environment variable
- **Eagle State Monitoring**: Root listeners for itemChange/libraryChange/folderChange events
- **Conditional Execution**: Scripts with `onStart` event auto-execute, others require manual execution
- **Manual Controls**: Execute and Clear buttons for user-controlled script execution
- **Output Container**: Selectable textbox for stdout/stderr display
- **Error Handling**: Wrapped callbacks with automatic cleanup on failure
- **Serialization Utilities**: Helper functions for Eagle data structure serialization

### Plugin Examples
- **Basic Plugin**: SDK demonstrations (Eagle API, CardManager, Storage) - Uses `powersdk.visual.CardManager`, `powersdk.storage.set/get`
- **Recent Libraries**: Complex UI with search, filtering, library management - Uses `powersdk.container`, `powersdk.visual.CardManager`, `powersdk.webapi.library.switch`
- **File Creator**: Dynamic file creation with extension management - Uses `powersdk.visual.Dialog`, `powersdk.utils.files.createFile`, `powersdk.storage.set/get`
- **Python Test Script**: Python script that accesses Eagle context and demonstrates environment variable usage

### Key Patterns
- **Organized Namespaces**: `powersdk.visual.*`, `powersdk.utils.*`, `powersdk.storage.*`, `powersdk.webapi.*`
- **Context Object**: Single `context` parameter with `{eagle, powersdk}`
- **createPowerSDKContext**: Centralized function for building organized powersdk object
- **Isolation**: DOM containers, prefixed storage, tracked event listeners
- **System APIs**: Native zip extraction (no external packages)
- **Eagle State Monitoring**: Configurable event type filtering (itemChange, folderChange, libraryChange) with optimized polling
- **Eagle Item Operations**: Batch folder-to-tag and tag-to-folder conversions with error handling and progress tracking
- **Universal Interface**: All plugins follow same signature pattern
- **Python Context**: Eagle data passed via `POWEREAGLE_CONTEXT` environment variable as JSON

### Technical Stack
- **Frontend**: React + TypeScript + TailwindCSS + DaisyUI
- **Backend**: Eagle.cool extension framework
- **File System**: Node.js fs/path modules via Eagle environment
- **Zip Handling**: System commands (PowerShell/unzip)
- **Storage**: LocalStorage with plugin prefixes
- **Python Execution**: Child process spawning with Eagle Node.js API integration

## Development Principles
- **Never hardcode plugin code in logic files**
- **Single responsibility per component**
- **Universal plugin interface**
- **System API over external packages**
- **Proper error handling and cleanup**
- **Python scripts receive full Eagle context**
- **Conditional execution based on manifest configuration**