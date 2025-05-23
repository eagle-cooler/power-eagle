# System Patterns

## Architecture Overview

### Package Management System
- Bucket-based package organization
- Local and remote package support
- Package installation and uninstallation
- Bucket management (add, remove, update)
- Package status tracking
- Mod name display consistency
- Remote package handling in mods.json

### Tab Management System
- Built-in tabs (Search, Package Manager)
- Dynamic mod tabs
- Tab history management
- Mod name display in tabs
- Tab state persistence

### Mod System
- Modular architecture with separate mod specifications
- V1 mod support
- Mod metadata handling
- Mod name management
- Context injection
- Direct mod class implementation

## Key Technical Decisions

### Package Management
1. Bucket Organization
   - Buckets as git repositories
   - Local bucket for development
   - Package metadata in mod.json
   - Remote package links in mods.json

2. Package Operations
   - Install from bucket
   - Uninstall with cleanup
   - Update with version tracking
   - Bucket removal with package cleanup
   - Direct remote package installation

3. Name Management
   - Package names from folder structure
   - Mod names from metadata
   - Display name consistency
   - Remote package name handling

### Mod System Architecture
1. Core Components
   - `modRunner/`: Core mod running infrastructure
     - `i.ts`: Core interfaces and types
     - `utils.ts`: Shared utility functions
     - `index.ts`: Mod type routing and creation
   - `modSpecs/`: Mod type implementations
     - `v1.ts`: V1 mod implementation

2. Mod Loading System
   - CommonJS module loading
   - Module caching
   - Context injection
   - Style loading
   - Entry point discovery
   - Direct mod class implementation

3. Context Management
   - Base context in core interfaces
   - Mod-specific context extensions
   - Context preparation per mod type
   - API versioning support

### Tab Management
1. Tab Structure
   - Built-in tabs for core functionality
   - Dynamic tabs for mods
   - Tab history for persistence

2. Name Display
   - Mod names from metadata
   - Fallback to package names
   - Consistent across all views

3. State Management
   - Tab history in local storage
   - Active tab tracking
   - Tab cleanup on removal

## Design Patterns

### Package Management
1. Repository Pattern
   - Buckets as package repositories
   - Local storage for installed packages
   - Package metadata management
   - Remote package handling

2. Observer Pattern
   - Package status updates
   - Bucket changes notification
   - UI state synchronization

3. Factory Pattern
   - Package creation
   - Mod runner creation
   - Bucket creation
   - Remote package installation

### Mod System
1. Strategy Pattern
   - Different mod type implementations
   - Common interface for all mods
   - Pluggable mod specifications
   - Direct mod class implementation

2. Factory Pattern
   - Mod type routing
   - Mod instance creation
   - Context preparation

3. Utility Pattern
   - Shared module loading
   - Common file operations
   - Cache management

## Component Relationships

### Package Manager
- Manages buckets and packages
- Handles package operations
- Updates tab names
- Manages package status
- Handles remote package installation

### Tab System
- Displays active tabs
- Manages tab history
- Handles tab operations
- Shows mod names

### Mod System
- Core infrastructure in modRunner
- Mod implementations in modSpecs
- Shared utilities for common operations
- Type-safe interfaces for mod interaction
- Direct mod class implementation

## Critical Implementation Paths

### Package Operations
1. Installation
   - Check package existence
   - Install from bucket
   - Update package status
   - Update tab name
   - Handle remote package installation

2. Uninstallation
   - Remove package files
   - Update package status
   - Clean up tab history

3. Bucket Management
   - Add bucket from git
   - Update bucket
   - Remove bucket with cleanup
   - Handle remote package links

### Mod Operations
1. Mod Loading
   - Entry point discovery
   - Module loading
   - Context preparation
   - Style loading
   - Direct mod class implementation

2. Mod Execution
   - Container mounting
   - Event handling
   - State management
   - Cleanup on unmount

## System Constraints

### Package Management
1. Bucket Structure
   - Must be valid git repository
   - Must contain valid packages
   - Must have proper metadata
   - Remote links must be package-only

2. Package Requirements
   - Must have valid mod.json
   - Must follow naming conventions
   - Must be compatible with mod system
   - Remote packages must be valid

### Mod System
1. Mod Type Requirements
   - Must implement IModRunner
   - Must handle context preparation
   - Must manage lifecycle events
   - Must provide direct class implementation

2. State Management
   - Local storage limitations
   - State synchronization
   - Error handling
   - Async operation handling

## Implementation Guidelines

### Package Management
1. Bucket Operations
   - Always clean up on removal
   - Maintain package consistency
   - Handle errors gracefully
   - Support remote package installation

2. Package Operations
   - Verify package validity
   - Update all related states
   - Provide user feedback
   - Handle remote package installation

### Mod System
1. Mod Implementation
   - Follow interface contracts
   - Handle errors gracefully
   - Provide clear feedback
   - Implement direct class handling

2. Context Management
   - Extend base context
   - Maintain type safety
   - Document API changes
   - Handle async operations

### Tab Management
1. Tab Operations
   - Use mod names when available
   - Maintain tab history
   - Handle errors gracefully

2. UI Guidelines
   - Clear visual feedback
   - Consistent naming
   - Proper error handling

## Mod Runner Architecture

### Type Detection
```typescript
// Each mod type must implement isType()
interface IModRunner {
    isType(path: string): Promise<boolean>;
}

// Type detection returns actual mod class implementation
async function getModType(modPath: string): Promise<typeof V1Mod | null> {
    for (const [type, ModClass] of Object.entries(modImpls)) {
        if (!ModClass) continue;
        if (await ModClass.isType(modPath)) {
            return ModClass;
        }
    }
    return null;
}
```

### Remote Package Installation
```typescript
// Remote package installation from mods.json
async function installRemotePackage(remoteLink: string, name: string): Promise<ModPkg | null> {
    // Remote links are guaranteed to be package-only
    const remoteBucket = await ModBucket.addFromGitUrl(remoteLink);
    if (remoteBucket) {
        return await ModPkg.install(remoteBucket, name);
    }
    return null;
}
``` 