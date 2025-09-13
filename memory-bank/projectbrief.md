# Project Brief: Power Eagle Meta Plugin System

## Overview
**Power Eagle** is a meta plugin system for Eagle.cool extensions that enables users to create, download, and manage custom userscript plugins.

## Core Requirements

### Plugin Architecture
- **Location**: `~user/.powereagle/extensions/{name}/`
- **Files**: `plugin.json` (id, name) + `main.js` (plugin function)
- **Function Signature**: `plugin(context)` where context = `{eagle, powersdk}`
- **SDK Access**: `powersdk` contains `{storage, container, CardManager, webapi, pluginId}`

### Key Features
- URL-based plugin downloading with zip validation
- Isolated execution contexts (DOM containers, prefixed storage)
- Rich UI support via CardManager SDK component
- Context menu management (open, hide built-in, delete installed)
- System API zip extraction (PowerShell/Unix)

## Current Status: **COMPLETE**
- ✅ Plugin discovery and management
- ✅ Real plugin downloading with zip validation
- ✅ Isolated execution contexts
- ✅ Rich UI plugins (Recent Libraries example)
- ✅ Context menu management
- ✅ System API zip extraction
- ✅ Modular architecture (discovery, loader, executor, management, download)