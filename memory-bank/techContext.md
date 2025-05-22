# Technical Context

## Core Technologies

### 1. Mod Runner System
- TypeScript for type safety
- CommonJS for module loading
- Node.js for file operations
- Path management for cross-platform support

### 2. Package Management
- File system operations
- Package validation
- Requirements management
- Lifecycle hooks

### 3. Module Loading
- CommonJS compatibility
- Module caching
- Error handling
- Context injection

## Development Setup

### 1. Project Structure
```
src/
  modRunner/
    i.ts         # Core interfaces
    utils.ts     # Shared utilities
    index.ts     # Mod type routing
  modSpecs/
    v1.ts        # V1 mod implementation
  modMgr/
    pkg.ts       # Package management
    bucket.ts    # Bucket management
    localMgr.ts  # Local package management
    utils.ts     # Shared utilities
    index.ts     # Main package manager
  components/    # UI components
  assets/        # Static assets
```

### 2. Dependencies
- Node.js >= 14
- TypeScript >= 4.5
- CommonJS modules
- File system operations

### 3. Build Process
- TypeScript compilation
- Module bundling
- Type checking
- Linting

## Technical Constraints

### 1. Module System
- CommonJS compatibility required
- No ESM support yet
- Module caching for performance
- Clear error handling

### 2. File Operations
- Cross-platform path handling
- Safe file operations
- Proper cleanup
- Error handling

### 3. Type Safety
- Strict TypeScript checks
- Interface compliance
- Error type handling
- Resource management

## Dependencies

### 1. Core Dependencies
- Node.js built-ins
- TypeScript
- CommonJS modules
- File system operations

### 2. Development Dependencies
- TypeScript compiler
- ESLint
- Testing framework
- Build tools

### 3. Runtime Dependencies
- Module loader
- File system utilities
- Path management
- Error handling

## Tool Usage

### 1. Development Tools
- TypeScript compiler
- ESLint
- Testing framework
- Build system

### 2. Runtime Tools
- Module loader
- File system utilities
- Path management
- Error handling

### 3. Testing Tools
- Unit testing
- Integration testing
- Error testing
- Performance testing

## Implementation Details

### 1. Mod Runner
- Unified interface
- Instance methods
- Lifecycle hooks
- Type safety

### 2. Package Management
- File operations
- Requirements handling
- Lifecycle hooks
- Error handling

### 3. Module Loading
- CommonJS support
- Module caching
- Error handling
- Context injection

## Technical Decisions

### 1. Architecture
- Single interface
- Instance methods
- Clear lifecycle
- Type safety

### 2. Implementation
- CommonJS modules
- File operations
- Error handling
- Resource management

### 3. Testing
- Unit tests
- Integration tests
- Error tests
- Performance tests

## Development Guidelines

### 1. Code Style
- TypeScript strict mode
- ESLint rules
- Error handling
- Documentation

### 2. Testing
- Unit test coverage
- Integration tests
- Error cases
- Performance tests

### 3. Documentation
- Interface documentation
- Implementation details
- Error handling
- Usage examples

## Technologies Used
1. Core Technologies
   - TypeScript
   - Electron
   - Node.js

2. Package Management
   - Git for bucket management
   - Local file system for packages
   - Version control integration
   - Package status tracking

3. Mod System
   - CommonJS modules
   - TypeScript interfaces
   - Event system
   - Context injection

## Development Setup
1. Environment
   - Node.js runtime
   - TypeScript compiler
   - Electron framework
   - Git for version control

2. Build Tools
   - Vite for bundling
   - TypeScript for compilation
   - ESLint for linting
   - Jest for testing

3. Dependencies
   - TailwindCSS for styling
   - Electron for desktop
   - Node.js APIs

## Technical Constraints
1. Package Management
   - Bucket structure requirements
   - Package naming conventions
   - Version format
   - Local package paths

2. Mod System
   - Module format
   - Context interface
   - Event handling
   - Resource loading

## Dependencies
1. Core Dependencies
   - react
   - electron
   - typescript
   - tailwindcss

2. Development Dependencies
   - webpack
   - eslint
   - jest
   - @types/node

## Tool Usage Patterns
1. Package Management
   - Git for buckets
   - File system for packages
   - Version tracking
   - Status management

2. Mod Development
   - CommonJS modules
   - TypeScript interfaces
   - Event system
   - Context injection

## Technical Decisions
1. Package Management
   - Full refresh on updates
   - Separate bucket handling
   - Version comparison
   - Local package support

2. Mod System
   - Direct context injection
   - Type-safe interfaces
   - Event-based communication
   - Module caching

## Implementation Details
1. Package Management
   - Bucket update process
   - Package installation
   - Version tracking
   - Status updates

2. Mod System
   - Context initialization
   - Module loading
   - Event handling
   - Resource management

## Technical Guidelines
1. Code Style
   - TypeScript best practices
   - React patterns
   - Error handling
   - Documentation

2. Architecture
   - Modular design
   - Type safety
   - Event-driven
   - Resource management

## Mod System Architecture

### Mod Types
- **v1**: Legacy mod type
  - No `mod.json` required
  - Must have at least one `.js` file
  - Optional `.css` files
  - Entry point: `index.js` (preferred) or `main.js`
  - Simple structure with direct DOM manipulation

### Mod Loading System

#### Core Components
1. **ModuleLoader** (`moduleLoader.ts`)
   - Handles module loading and context injection
   - Provides global `powerEagle` API to mods
   - Manages mod execution context
   - Safe global context handling

2. **V1ModLoader** (`v1.ts`)
   - Implements `IModLoader` interface
   - Handles v1-specific mod loading
   - Manages mod lifecycle (mount/unmount)
   - Handles event registration

3. **ModRunner** (`index.ts`)
   - Factory for creating mod runners
   - Validates mod structure
   - Routes to appropriate loader based on type
   - Manages mod package integration

#### Interfaces
```typescript
interface IModRunner {
    mount(container: HTMLElement): Promise<void>;
    unmount(): void;
    getModName(): string;
}

interface IModLoader {
    loadMod(entryPath: string, name?: string): Promise<IModRunner | null>;
}

interface ModContext {
    powerEagle?: {
        version: string;
        api: {
            log: (message: string) => void;
            // ... other API methods
        };
    };
}
```

### Mod Package Management
- Packages stored in `POWER_EAGLE_PKGS_PATH`
- Buckets stored in `POWER_EAGLE_BUCKETS_PATH`
- Local development links supported
- Package installation/uninstallation handled by `ModMgr`

## Development Setup
- Electron-based application
- TypeScript for type safety
- Node.js for backend operations
- Browser APIs for frontend rendering

## Technical Constraints
1. No `vm` module usage in renderer process
2. Safe global context handling
3. Proper cleanup on mod unmount
4. Type-safe mod interfaces

## Dependencies
- Node.js built-in modules (path, fs)
- Electron
- TypeScript

## Tool Usage Patterns
- `require` for module loading
- Global context injection for mod API
- File system operations for mod discovery
- DOM manipulation for mod rendering

## Technology Stack
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Package Manager**: pnpm
- **Version Control**: Git

## Project Structure
```
power-eagle/
├── src/              # Source code
├── dist/             # Build output
├── public/           # Static assets
├── _locales/         # Localization files
├── memory-bank/      # Project documentation
└── configuration files
```

## Development Workflow
1. Use Git for version control
2. Follow TypeScript/ESLint guidelines
3. Test changes in Eagle environment
4. Build and package for distribution

## Build Process
1. Development: `vite` for hot reloading
2. Production: Build to `dist` directory
3. Package: Create distributable plugin

## Testing Strategy
1. Manual testing in Eagle environment
2. TypeScript type checking
3. ESLint code quality checks
4. Cross-browser compatibility testing 

## Mod Runner Implementation

### Core Components
1. `IModRunner` Interface
   - Defines required instance methods
   - Documents optional static lifecycle methods
   - Each mod type must implement `isType()`

2. Mod Type Detection
   - Uses `isType()` method from each implementation
   - Handles undefined/unsupported types gracefully
   - Type detection happens before file operations

3. Installation Process
   - Pre-install hooks for preparation
   - File copying
   - Post-install hooks for dependencies
   - Cleanup on failure

### Type System
1. Mod Types
   - `v1`: Legacy mods (no mod.json)

2. Implementation Map
```typescript
const modImpls = {
    v1: V1Mod
}
```

3. Type Safety
   - Minimal type annotations
   - Clear handling of undefined cases
   - Proper error handling

### Dependencies
1. Node.js Modules
   - `path`: Path manipulation
   - `fs`: File system operations
   - `child_process`: For npm operations

2. TypeScript Features
   - Type inference
   - Interface implementation
   - Optional static methods

### Development Setup
1. TypeScript Configuration
   - Strict type checking
   - Module resolution
   - Path aliases

2. Build Process
   - TypeScript compilation
   - Module bundling
   - Development server

### Technical Constraints
1. Mod Type Support
   - Only v1 mods fully supported
   - Clear upgrade path

2. Installation Process
   - Must handle dependencies
   - Must support hooks
   - Must clean up on failure

3. Type Safety
   - Must handle undefined cases
   - Must validate mod types
   - Must provide clear errors 