# Active Context: Power Eagle Userscript System

## Current State: **COMPLETE & PRODUCTION READY**

### Project Understanding Clarified
Power Eagle is a **userscript-style plugin system** for Eagle.cool, providing a Tampermonkey-like experience for quick script installation and sharing. It complements Eagle's native extensions by focusing on simplicity and instant gratification.

### Recent Accomplishments
- ✅ **Instant Plugin Installation**: Real URL downloading with zip validation using system APIs
- ✅ **Auto-Overwrite Updates**: Smart plugin replacement (same ID = automatic overwrite)
- ✅ **System API Integration**: PowerShell (Windows) and unzip (macOS) for zip extraction
- ✅ **Modular Architecture**: Clean separation of concerns (discovery, loader, executor, management, download)
- ✅ **Universal Plugin Interface**: All plugins use `plugin(context)` with `{eagle, powersdk}` destructuring
- ✅ **Organized SDK Namespaces**: `powersdk.visual.*`, `powersdk.utils.*`, `powersdk.storage.*`, `powersdk.webapi.*`
- ✅ **Multi-Language Support**: JavaScript for UI, Python for automation
- ✅ **TypeScript Conversion**: Full type safety and modern development experience
- ✅ **Enhanced Plugin Examples**: Demonstrate real-world use cases and patterns

### Architecture Components
- **PluginDiscovery**: Scans installed plugins, handles URL-based downloads
- **PluginLoader**: Loads plugin code from files/examples
- **PluginExecutor**: Executes JavaScript plugins in isolated contexts
- **PythonScriptRunner**: Executes Python scripts with Eagle context integration
- **PluginManagement**: Handles plugin removal/hiding/management
- **PluginDownload**: Downloads and validates zip files using system APIs with auto-overwrite
- **RootListeners**: Eagle application state monitoring for Python scripts
- **Operation Utilities**: Eagle folder/tag conversion utilities

### Plugin Types Supported
1. **JavaScript Plugins** (`"type": "plugin"`): Rich UI plugins with full SDK access
2. **Python Scripts** (`"type": "python-script"`): Automation scripts with Eagle context via environment variables

### Key Features Delivered
- **Instant Installation**: Paste URL → Working plugin in seconds
- **Community Sharing**: Easy distribution via GitHub releases or any hosting
- **Auto-Overwrite**: Re-download same plugin automatically updates
- **Rich UI Support**: Complex interfaces with CardManager, Dialog, Button components
- **Eagle Integration**: Full access to Eagle's API and data structures
- **Isolated Execution**: Safe plugin contexts with prefixed storage
- **Multi-Language**: JavaScript for UI work, Python for automation/scripting

### Plugin Examples
- **Basic Plugin**: SDK demonstrations and Eagle API usage patterns
- **Recent Libraries**: Advanced library switching with search and filtering
- **File Creator**: Dynamic file creation with custom extensions
- **Python Test Script**: Eagle context access and automation demonstration

### Current Focus
System is complete and ready for community use. Focus areas:
- Documentation clarity about userscript vs native extension differences
- Community adoption and plugin sharing
- User experience refinements based on real usage
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