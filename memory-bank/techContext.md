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

### File System Operations
- **Plugin Storage**: `~user/.powereagle/extensions/{pluginId}/`
- **Download Cache**: `~user/.powereagle/download/new.zip`
- **System APIs**: PowerShell (Windows) and unzip (macOS) for zip extraction

### Plugin Development
- **Manifest**: Minimal `plugin.json` with `id` and `name`
- **Code**: `main.js` with `plugin(context)` function export
- **SDK Access**: `powersdk` object with utilities and components

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

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari (Eagle's Electron environment)
- **ES6+ Features**: Async/await, destructuring, modules
- **DOM APIs**: Standard browser APIs for UI manipulation
- **Storage**: LocalStorage with plugin-specific prefixes