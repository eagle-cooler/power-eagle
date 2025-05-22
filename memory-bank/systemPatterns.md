# System Patterns

## Architecture Overview
1. Package Management
   - Bucket-based package organization
   - Local and remote package support
   - Version tracking and updates
   - Package status management

2. Mod System
   - V1 mod support
   - Context injection
   - Module loading
   - Event handling

## Key Technical Decisions
1. Package Management
   - Full refresh on bucket updates
   - Separate bucket and installed package handling
   - Version comparison for updates
   - Local package linking

2. Context Management
   - Direct context injection
   - Type-safe context interface
   - Default context fallback
   - Mount-time context passing

3. Module Loading
   - CommonJS compatibility
   - Safe module execution
   - Caching support
   - Error handling

## Design Patterns
1. Package Management
   - Repository pattern for buckets
   - Factory pattern for package creation
   - Observer pattern for updates
   - Strategy pattern for package types

2. Mod System
   - Factory pattern for mod creation
   - Dependency injection for context
   - Observer pattern for events
   - Strategy pattern for mod types

## Component Relationships
1. Package Management
   - ModMgr -> Buckets -> Packages
   - PackageManager -> ModMgr
   - LocalMgr -> ModMgr

2. Mod System
   - ModuleLoader -> ModContext
   - V1ModLoader -> ModuleLoader
   - ModIPC -> EventHandlers

## Critical Implementation Paths
1. Package Updates
   - Bucket update
   - Package refresh
   - Version comparison
   - Status update

2. Mod Loading
   - Context initialization
   - Module loading
   - Event registration
   - Mount process

## System Constraints
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

## Implementation Guidelines
1. Package Management
   - Always refresh on updates
   - Handle all package states
   - Maintain version accuracy
   - Support local packages

2. Mod System
   - Use direct context injection
   - Follow type safety
   - Handle all mod types
   - Support events 