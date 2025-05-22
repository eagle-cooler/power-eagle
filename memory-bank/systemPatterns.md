# System Patterns

## Architecture Overview

### Package Management System
- Bucket-based package organization
- Local and remote package support
- Package installation and uninstallation
- Bucket management (add, remove, update)
- Package status tracking
- Mod name display consistency

### Tab Management System
- Built-in tabs (Search, Package Manager)
- Dynamic mod tabs
- Tab history management
- Mod name display in tabs
- Tab state persistence

### Mod System
- V1 mod support
- React mod support (planned)
- Mod metadata handling
- Mod name management
- Context injection

## Key Technical Decisions

### Package Management
1. Bucket Organization
   - Buckets as git repositories
   - Local bucket for development
   - Package metadata in mod.json

2. Package Operations
   - Install from bucket
   - Uninstall with cleanup
   - Update with version tracking
   - Bucket removal with package cleanup

3. Name Management
   - Package names from folder structure
   - Mod names from metadata
   - Display name consistency

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

2. Observer Pattern
   - Package status updates
   - Bucket changes notification
   - UI state synchronization

3. Factory Pattern
   - Package creation
   - Mod runner creation
   - Bucket creation

### Tab Management
1. State Management
   - Tab history persistence
   - Active tab tracking
   - Tab state updates

2. Event Handling
   - Tab selection
   - Tab closure
   - Tab history updates

3. UI Patterns
   - Tab bar display
   - Tab content rendering
   - Interactive elements

## Component Relationships

### Package Manager
- Manages buckets and packages
- Handles package operations
- Updates tab names
- Manages package status

### Tab System
- Displays active tabs
- Manages tab history
- Handles tab operations
- Shows mod names

### Mod System
- Loads mods
- Manages mod context
- Provides mod metadata
- Handles mod lifecycle

## Critical Implementation Paths

### Package Operations
1. Installation
   - Check package existence
   - Install from bucket
   - Update package status
   - Update tab name

2. Uninstallation
   - Remove package files
   - Update package status
   - Clean up tab history

3. Bucket Management
   - Add bucket from git
   - Update bucket
   - Remove bucket with cleanup

### Tab Operations
1. Tab Creation
   - Check mod existence
   - Create tab with mod name
   - Update tab history

2. Tab Management
   - Track active tab
   - Handle tab closure
   - Maintain tab history

## System Constraints

### Package Management
1. Bucket Structure
   - Must be valid git repository
   - Must contain valid packages
   - Must have proper metadata

2. Package Requirements
   - Must have valid mod.json
   - Must follow naming conventions
   - Must be compatible with mod system

### Tab System
1. Tab Limitations
   - Maximum tab history size
   - Built-in tab restrictions
   - Tab name length limits

2. State Management
   - Local storage limitations
   - State synchronization
   - Error handling

## Implementation Guidelines

### Package Management
1. Bucket Operations
   - Always clean up on removal
   - Maintain package consistency
   - Handle errors gracefully

2. Package Operations
   - Verify package validity
   - Update all related states
   - Provide user feedback

### Tab Management
1. Tab Operations
   - Use mod names when available
   - Maintain tab history
   - Handle errors gracefully

2. UI Guidelines
   - Clear visual feedback
   - Consistent naming
   - Proper error handling 