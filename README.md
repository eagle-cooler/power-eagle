> for gitops workflows, refer to [template](https://github.com/eagle-cooler/template)

# Power Eagle - Meta Plugin System

**Power Eagle** is a meta plugin system for Eagle.cool extensions that enables users to create, download, and manage custom userscript plugins. It provides a simple way to extend Eagle's functionality through URL-based plugin installation and rich UI components with organized SDK namespaces.

## Features

- 🔌 **Plugin Management**: Download and install plugins from URLs
- 🎨 **Rich UI Support**: SDK for complex interfaces with organized namespaces
- 🔒 **Isolated Execution**: Safe plugin contexts with prefixed storage
- 📦 **System Integration**: Native zip extraction using OS APIs
- 🎯 **Simple Development**: Just `plugin.json` + `main.js` files
- 🏗️ **Organized SDK**: Structured namespaces (`powersdk.visual`, `powersdk.utils`, `powersdk.storage`)

## Quick Start

### Basic Plugin Structure

```
my-plugin/
├── plugin.json          # Plugin manifest
└── main.js             # Plugin implementation
```

### Plugin Example

```javascript
// main.js
const plugin = async (context) => {
  const { eagle, powersdk } = context;
  
  // Use organized namespaces
  const cardManager = new powersdk.visual.CardManager(powersdk.container);
  
  cardManager.addCardToContainer({
    title: 'My Plugin',
    content: '<p>Hello from my plugin!</p>',
    actions: [
      {
        text: 'Count Files',
        onClick: async () => {
          const files = await eagle.item.getSelected();
          powersdk.storage.set('count', files.length);
          await eagle.notification.show({
            title: 'File Count',
            description: `Found ${files.length} files`
          });
        }
      }
    ]
  });
};
```

### Plugin Manifest

```json
{
  "id": "my-plugin",
  "name": "My Plugin"
}
```

## SDK Reference

The Power Eagle SDK provides organized namespaces for better developer experience:

### Core Functionality
- `powersdk.storage` - Isolated localStorage with plugin-specific prefixes
- `powersdk.container` - Plugin's DOM container
- `powersdk.pluginId` - Unique plugin identifier

### Visual Components
- `powersdk.visual.Button` - Enhanced button component
- `powersdk.visual.CardManager` - Rich card UI system
- `powersdk.visual.Dialog` - Modal dialog component

### Utility Functions
- `powersdk.utils.files` - File operations (`createFile`, `extractZip`, `formatBytes`)
- `powersdk.utils.paths` - Path utilities (`getDownloadPath`, `getExtensionsPath`)
- `powersdk.utils.dom` - DOM utilities (`createElement`, `copyToClipboard`)
- `powersdk.utils.common` - Common utilities (`debounce`, `throttle`, `generateId`)

### Eagle API
- `powersdk.webapi` - Eagle HTTP API wrapper

For complete documentation, see [SDK Reference](./docs/sdk-reference.md) and [Usage Examples](./docs/usage-examples.md).

## Example Plugins

This repository includes three example plugins demonstrating different SDK features:

- **[Basic Plugin](./src/examples/basic-plugin.tsx)** - SDK demonstrations (Eagle API, CardManager, Storage)
- **[Recent Libraries](./src/examples/recent-libraries.tsx)** - Complex UI with search, filtering, library management
- **[File Creator](./src/examples/file-creator.tsx)** - Dynamic file creation with extension management

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS + DaisyUI
- **Backend**: Eagle.cool Extension Framework
- **File System**: Node.js fs/path modules

## Development

1. Clone and install dependencies:
   ```bash
   git clone <repository>
   cd power-eagle2
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Plugin Installation

1. **Create Plugin**: Create folder with `plugin.json` and `main.js`
2. **Zip Plugin**: Package your plugin folder as a `.zip` file
3. **Upload**: Host the zip file on any public URL
4. **Install**: Use Power Eagle to download from the URL

Plugins are installed to `~user/.powereagle/extensions/{pluginId}/`

## Contributing

See example plugins in `src/examples/` for implementation patterns. All plugins use the universal `plugin(context)` signature and organized SDK namespaces.
