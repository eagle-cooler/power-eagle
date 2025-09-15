# Product Context: Power Eagle Userscript System

## Problem Solved
Eagle.cool has powerful native extensions, but lacks a simple way to create and share lightweight scripts. Users need a **userscript experience** for quick automation and community sharing.

## Solution
A userscript-style plugin system that enables:
- **Instant Installation**: Paste URL → Working plugin in seconds (like Tampermonkey)
- **Simple Creation**: Just `plugin.json` + `main.js/py` files
- **Easy Sharing**: Distribute via GitHub releases, Gists, any hosting
- **Community Focus**: Built for peer-to-peer script distribution

## User Experience
- **Discovery**: Find plugin URLs on GitHub, forums, social media
- **Installation**: Paste URL in Power Eagle → Instant download and install
- **Management**: Simple interface to enable/disable/remove plugins
- **Updates**: Re-paste same URL → Auto-overwrite with new version
- **Rich UIs**: Plugins can create complex interfaces when needed

## Developer Experience
- **Minimal Setup**: Two files: `plugin.json` + script file
- **Simple API**: Single `context` object with organized SDK namespaces
- **Multiple Languages**: JavaScript for UI, Python for automation
- **Eagle Integration**: Full access to Eagle's API and data structures
- **Community Sharing**: No complex distribution - just host a zip file

## Key Differentiators vs Eagle Native Extensions
- **Speed**: Instant installation vs complex setup
- **Simplicity**: 2 files vs full development environment
- **Sharing**: URL-based vs manual file management
- **Community**: Designed for sharing small utilities
- **Scope**: Focused on scripts/utilities vs full applications

## Success Metrics
- ✅ URL-based installation works reliably
- ✅ Auto-overwrite enables easy updates
- ✅ Rich UI support for complex plugins
- ✅ Python script integration with Eagle context
- ✅ Isolated execution prevents conflicts
- ✅ Community can easily share and discover plugins