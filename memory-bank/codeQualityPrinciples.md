# Code Quality Principles: Power Eagle Meta Plugin System

## Core Principles

### 1. Never Hardcode Plugin Code
- **Rule**: Plugin code must be in separate files, never embedded in logic
- **Implementation**: Import from `src/examples/*.tsx` or load from `main.js` files
- **Rationale**: Maintains separation of concerns and enables dynamic loading

### 2. Universal Plugin Interface
- **Rule**: All plugins use `plugin(context)` signature
- **Context Object**: Single parameter with `{eagle, powersdk}` destructuring
- **Rationale**: Consistent interface reduces complexity and learning curve

### 3. Single Responsibility Components
- **Rule**: Each component has one clear purpose
- **Implementation**: Separate discovery, loading, execution, management, download
- **Rationale**: Easier to maintain, test, and debug

### 4. System API Over External Packages
- **Rule**: Use native OS capabilities when possible
- **Implementation**: PowerShell/unzip for zip extraction, Node.js modules for file ops
- **Rationale**: Reduces dependencies and improves reliability

### 5. Proper Error Handling
- **Rule**: All operations wrapped in try-catch with user notifications
- **Implementation**: Eagle notifications for user feedback, console logging for debugging
- **Rationale**: Graceful failure handling improves user experience

### 6. Context Injection Pattern
- **Rule**: SDK components available in execution context
- **Implementation**: Inject CardManager, webapi, storage into `powersdk` object
- **Rationale**: Clean API surface for plugin developers

### 7. Isolation and Cleanup
- **Rule**: Each plugin runs in isolated context with proper cleanup
- **Implementation**: DOM containers, prefixed storage, tracked event listeners
- **Rationale**: Prevents conflicts between plugins and memory leaks

## Code Organization
- **Manager Components**: Single responsibility (discovery, loader, executor, management, download)
- **SDK Components**: Reusable utilities (CardManager, webapi, utils)
- **Plugin Examples**: Demonstrations of capabilities
- **Type Definitions**: Centralized in `src/sdk/types.ts`

## Development Standards
- **TypeScript**: Strong typing throughout
- **JSDoc**: Documentation for all public methods
- **Error Handling**: Comprehensive try-catch blocks
- **Cleanup**: Proper resource management and event listener removal
- **Modularity**: Clear separation between components