# Mod Specification

## Overview
This document outlines the specification for creating V1 mods for Power Eagle. V1 mods are the primary way to extend Power Eagle's functionality through a simple and standardized interface.

## Mod Structure
A V1 mod consists of the following components:

```
my-mod/
├── index.js        # Main entry point
├── styles.css      # Optional styles
└── mod.json        # Optional metadata
```

### Entry Point (index.js)
The entry point file must export a mod object with the following structure:

```javascript
module.exports = {
    // Required: Initialize the mod
    init: async function(context) {
        // context provides access to Power Eagle APIs
        this.context = context;
    },

    // Required: Mount the mod's UI
    mount: async function(container) {
        // container is the DOM element where the mod should render
        this.container = container;
    },

    // Required: Clean up when the mod is unmounted
    unmount: function() {
        // Clean up resources, event listeners, etc.
    }
};
```

### Styles (styles.css)
Optional CSS file for styling the mod's UI. Styles are scoped to the mod's container.

### Metadata (mod.json)
Optional metadata file that provides information about the mod:

```json
{
    "name": "My Mod",
    "version": "1.0.0",
    "description": "Description of what the mod does",
    "author": "Your Name",
    "type": "v1"
}
```

## Context API
The context object provides access to Power Eagle's APIs:

```typescript
interface ModContext {
    // Logging
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;

    // UI
    createElement: (tag: string) => HTMLElement;
    createTextNode: (text: string) => Text;

    // Storage
    storage: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
        remove: (key: string) => Promise<void>;
    };

    // Events
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    emit: (event: string, data?: any) => void;
}
```

## Lifecycle
1. **Initialization**
   - Mod is loaded and `init()` is called
   - Context is provided for API access
   - Mod should prepare any necessary resources

2. **Mounting**
   - `mount()` is called when the mod should display its UI
   - Container element is provided for rendering
   - Mod should create and attach its UI elements

3. **Unmounting**
   - `unmount()` is called when the mod is being removed
   - Mod should clean up resources and event listeners
   - UI elements should be properly detached

## Best Practices
1. **Error Handling**
   - Always wrap async operations in try/catch
   - Use context.error() for error logging
   - Handle edge cases gracefully

2. **Resource Management**
   - Clean up resources in unmount()
   - Remove event listeners
   - Clear any intervals or timeouts

3. **UI Guidelines**
   - Use the provided container for all UI elements
   - Follow Eagle's design patterns
   - Keep the UI responsive and performant

4. **Storage Usage**
   - Use mod-specific keys for storage
   - Handle storage errors gracefully
   - Clean up storage when appropriate

## Example Mod
Here's a complete example of a simple counter mod:

```javascript
// index.js
module.exports = {
    count: 0,
    counterElement: null,

    init: async function(context) {
        this.context = context;
        this.context.log('Counter mod initialized');
    },

    mount: async function(container) {
        this.container = container;
        
        // Create UI
        this.counterElement = this.context.createElement('div');
        this.counterElement.textContent = `Count: ${this.count}`;
        
        const button = this.context.createElement('button');
        button.textContent = 'Increment';
        button.onclick = () => {
            this.count++;
            this.counterElement.textContent = `Count: ${this.count}`;
        };
        
        this.container.appendChild(this.counterElement);
        this.container.appendChild(button);
    },

    unmount: function() {
        // Clean up
        this.container.innerHTML = '';
        this.counterElement = null;
    }
};
```

```css
/* styles.css */
button {
    margin-top: 8px;
    padding: 4px 8px;
    background: #4a4a4a;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background: #5a5a5a;
}
```

```json
// mod.json
{
    "name": "Counter",
    "version": "1.0.0",
    "description": "A simple counter mod",
    "author": "Power Eagle Team",
    "type": "v1"
}
```

## Testing
1. Create a local development environment
2. Test the mod's initialization
3. Verify UI rendering and interactions
4. Check resource cleanup
5. Test error handling
6. Verify storage operations

## Distribution
1. Package the mod files
2. Create a mod bucket or use an existing one
3. Submit the mod for review
4. Once approved, the mod will be available for installation

## Support
For help with mod development:
1. Check the documentation
2. Review example mods
3. Submit issues for bugs
4. Request features through issues 