# Power Eagle SDK

A simple SDK for creating userscript meta plugins for the Eagle.cool extension.

## Overview

The Power Eagle SDK provides a minimal way to create extensions that can be loaded from `~user/.powereagle/extensions/{name}`. Each extension consists of a `main.js` function and a `plugin.json` manifest.

## Quick Start

### 1. Create an Extension

Create a folder structure:
```
~user/.powereagle/extensions/my-plugin/
├── plugin.json
└── main.js
```

### 2. Define Plugin Manifest (`plugin.json`)

```json
{
  "id": "my-plugin",
  "name": "My Plugin"
}
```

### 3. Create Plugin Function (`main.js`)

```javascript
function myPlugin(api, eagle) {
  // Register a button
  api.registerButton({
    id: 'my-button',
    text: 'Click Me',
    onClick: () => {
      eagle.notification.show({
        title: 'Plugin Action',
        description: 'Hello from my plugin!'
      });
    }
  });
}
```

## API Reference

### Plugin Function Parameters

- `api`: Plugin API object
- `eagle`: Eagle API object

### Plugin API

#### `api.registerButton(config)`
Register a new button in the Power Eagle interface.

**Parameters:**
- `config.id` (string): Unique button identifier
- `config.text` (string): Button text
- `config.onClick` (function): Click handler

### Eagle API

#### `eagle.notification.show(options)`
Show notifications to the user using the global eagle object.

**Parameters:**
- `options.title` (string): Notification title
- `options.description` (string): Notification description

## Examples

See the `examples/` directory for complete plugin examples.
