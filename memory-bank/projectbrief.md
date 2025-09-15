# Project Brief: Power Eagle Userscript Plugin System

## Overview
**Power Eagle** is a userscript-style plugin system for Eagle.cool that enables quick, lightweight scripting extensions. While Eagle.cool already has a robust extension system, Power Eagle provides a **userscript experience** for simple, single-file plugins that can be installed instantly from URLs.

## Core Purpose

### The Problem
- Eagle's native extensions require complex development workflows
- Sharing simple scripts/utilities is difficult
- Community lacks an easy way to distribute quick automation tools
- No instant "paste URL and get plugin" experience

### The Solution
Power Eagle provides a **Tampermonkey-like experience for Eagle**:
- Paste a URL → Working plugin in seconds
- Simple development: just `plugin.json` + `main.js/py` files
- Easy community sharing via GitHub releases or direct links
- Focus on quick utilities, automation, and personal workflows

## Plugin Architecture
- **Location**: `~user/.powereagle/extensions/{id}/`
- **Files**: `plugin.json` (id, name, type) + `main.js` or `main.py`
- **Function Signature**: `plugin(context)` where context = `{eagle, powersdk}`
- **SDK Access**: `powersdk` contains organized namespaces for UI, utilities, storage

## Key Features
- URL-based instant plugin installation with zip validation
- Isolated execution contexts (DOM containers, prefixed storage)
- Rich UI support via organized SDK (`powersdk.visual.*`, `powersdk.utils.*`)
- Multi-language support (JavaScript + Python)
- Auto-overwrite for easy plugin updates
- System API zip extraction (PowerShell/Unix)

## Current Status: **COMPLETE**
- ✅ Instant plugin downloading and installation
- ✅ JavaScript plugins with rich UI support
- ✅ Python scripts with Eagle context integration
- ✅ Isolated execution contexts
- ✅ Auto-overwrite plugin updates
- ✅ Comprehensive SDK with organized namespaces
- ✅ System API zip extraction