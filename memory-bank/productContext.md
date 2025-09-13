# Product Context: Power Eagle Meta Plugin System

## Problem Solved
Eagle.cool users need a way to extend functionality through custom plugins without complex development setup.

## Solution
A meta plugin system that enables:
- **Simple Plugin Creation**: Just `plugin.json` + `main.js` files
- **Easy Installation**: Download plugins via URL
- **Rich Interfaces**: Support for complex UIs with search, filtering, cards
- **Safe Execution**: Isolated contexts prevent plugin conflicts

## User Experience
- **Discovery**: Browse installed plugins in main interface
- **Installation**: Paste URL, automatic download and validation
- **Management**: Right-click context menu for plugin actions
- **Rich UIs**: Plugins can create complex interfaces (demonstrated by Recent Libraries)

## Plugin Developer Experience
- **Minimal Setup**: Just two files required
- **Simple API**: Single `context` object with all needed functionality
- **Rich SDK**: CardManager, storage, Eagle API access
- **Universal Pattern**: Same interface for all plugins

## Key Features
- **URL-based Installation**: Download plugins from any zip URL
- **System API Integration**: Native zip extraction (no external dependencies)
- **Isolated Execution**: Each plugin runs in its own context
- **Rich UI Support**: CardManager component for complex layouts
- **Context Menu Management**: Clean plugin management without UI clutter

## Success Metrics
- ✅ Plugins can be downloaded and installed
- ✅ Rich UI plugins work (Recent Libraries example)
- ✅ Plugin isolation prevents conflicts
- ✅ System uses native APIs (no external packages)
- ✅ Clean, maintainable architecture