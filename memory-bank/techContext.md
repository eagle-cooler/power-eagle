# Technical Context: Power Eagle Meta Plugin System

## Technology Stack

### Frontend
- **React 18**: Component-based UI with hooks
- **TypeScript**: Strong typing and IntelliSense
- **TailwindCSS + DaisyUI**: Utility-first styling with component library
- **Vite**: Fast build tool and dev server

### Backend Integration
- **Eagle.cool Extension Framework**: Host application
- **Global Eagle API**: `window.eagle` object for native functionality
- **Node.js Modules**: `fs`, `path`, `child_process` via Eagle environment

### **Revolutionary Python Integration** 🚀
- **py-eagle-cooler Library**: `https://github.com/eagle-cooler/py-eagle-cooler` for Python → Eagle callbacks
- **PythonScriptEvaler**: Advanced callback signal processing system
- **Stderr Signal Protocol**: `$$$token$$$plugin$$$method(args)` for secure communication
- **Bidirectional Communication**: Full Python ↔ Eagle API integration
- **Token Security**: Eagle API token validation for secure callback execution
- **Safe Execution**: `asyncExecReadonly` isolation for callback processing
- **Clean Output**: Intelligent filtering separates callbacks from regular Python output

### File System Operations
- **Plugin Storage**: `~user/.powereagle/extensions/{pluginId}/`
- **Download Cache**: `~user/.powereagle/download/new.zip`
- **System APIs**: PowerShell (Windows) and unzip (macOS) for zip extraction

### Plugin Development
- **Manifest**: Minimal `plugin.json` with `id`, `name`, and `type` (`"plugin"` or `"python-script"`)
- **JavaScript Code**: `main.js` with `plugin(context)` function export
- **Python Code**: `main.py` with Eagle context via environment variables + callback support
- **SDK Access**: `powersdk` object with utilities and components for JavaScript plugins
- **Python API Access**: Direct Eagle API calls via `py-eagle-cooler` callback system

### Development Environment
- **Package Manager**: npm/pnpm
- **Build System**: Vite with TypeScript
- **Linting**: ESLint with TypeScript rules
- **Platform Support**: Windows (PowerShell) and macOS (Unix commands)

### Key Dependencies
- **No External Zip Libraries**: Uses system APIs only
- **Eagle API Client**: Custom `webapi.ts` for HTTP requests
- **CardManager**: Custom UI component for rich layouts
- **Utility Functions**: Custom utils for zip operations and helpers
- **RootListeners**: Custom Eagle state monitoring with configurable event filtering
- **Operation Utilities (op.ts)**: Custom Eagle folder/tag conversion utilities
- **PythonScriptEvaler**: **Revolutionary stderr-based callback processing system**
- **py-eagle-cooler**: External Python library for Eagle API callbacks
- **asyncExecReadonly**: Secure code execution engine for callback processing

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari (Eagle's Electron environment)
- **ES6+ Features**: Async/await, destructuring, modules
- **DOM APIs**: Standard browser APIs for UI manipulation
- **Storage**: LocalStorage with plugin-specific prefixes

## **Python Callback System Technical Details** 🚀

### **Signal Processing Architecture**
- **Protocol**: `$$$token$$$plugin$$$method(args)` format via stderr
- **Real-time Parsing**: Live stderr interception and callback signal extraction
- **Output Filtering**: Seamless removal of callback signals from user-visible output
- **Token Validation**: Security layer using Eagle API tokens for authentication
- **Method Intelligence**: Automatic filtering between action methods and return-value methods

### **Security Implementation**
- **Token-Based Authentication**: Each callback validated against current Eagle API token
- **Plugin Isolation**: Plugin ID validation ensures callbacks only affect intended plugin
- **Safe Execution Context**: `asyncExecReadonly` prevents code injection and global mutations
- **Method Whitelist**: `METHODS_WITH_RETURN_VALUES` set prevents problematic API calls

### **Integration Flow**
```typescript
PythonScriptRunner → pythonExecutorV2 → PythonScriptEvaler.executeScriptWithCallbacks()
                                      ↓
Python stderr: "Regular output\n$$$token$$$plugin$$$method(...)\nMore output"
                                      ↓
handleStderrData() → parseCallbackSignal() → executeEagleAPICall()
                                      ↓
Filtered output: "Regular output\nMore output" + Eagle API executed
```

### **Library Integration**
- **py-eagle-cooler**: External Python package providing `EagleCallback` interface
- **Automatic Installation**: Users install `pip install eagle-cooler` for callback support
- **Simple API**: `EagleCallback.folder.create(name="test")` sends appropriate signals
- **Community Maintained**: Separate repository for Python library development

## Eagle Integration Utilities

### State Monitoring (`root-listeners.ts`)
- **Polling-Based**: Monitors Eagle application state changes via polling
- **Event Types**: itemChange, folderChange, libraryChange with selective monitoring
- **Change Detection**: Sorted array comparisons for consistent state tracking
- **Performance Optimized**: Only monitor requested event types to reduce overhead
- **Error Recovery**: Automatic cleanup of failed callbacks with callback statistics

### Item Operations (`op.ts`)
- **Folder Discovery**: `getFolderByName()` for finding folders by name
- **Folder-to-Tag Conversion**: `swapFolderToTag()` for batch organizational changes
- **Tag-to-Folder Conversion**: `swapTagToFolder()` with automatic folder creation
- **Batch Processing**: Handle multiple selected items with individual error tracking
- **Data Integrity**: Fresh item data retrieval and proper save operations