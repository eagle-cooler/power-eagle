# Python Script Plugins

Python Script plugins bring the **userscript experience** to Python automation within Eagle. Write simple Python scripts that can access Eagle data and automate library operations - perfect for batch processing, data analysis, and custom workflows that benefit from Python's rich ecosystem.

## Overview

Python script plugins run as separate processes and receive Eagle data through the `POWEREAGLE_CONTEXT` environment variable. This enables you to leverage Python's powerful libraries while maintaining seamless integration with Eagle - combining the simplicity of userscripts with the power of Python automation.

## Key Features

### 🔄 Eagle Context Integration
- Full access to selected folders, items, and library information
- Real-time Eagle state monitoring
- Web API token for external integrations

### ⚡ Execution Modes
- **Auto-execution**: Scripts with `"onStart"` event execute automatically
- **Manual execution**: Scripts without `"onStart"` show Execute/Clear controls
- **Conditional execution**: Based on manifest configuration

### 📊 State Monitoring
- Real-time monitoring of Eagle application state
- Automatic context updates when selection changes
- Library and folder change detection

### 🖥️ Output Display
- Stdout and stderr displayed in selectable textbox
- Real-time output streaming
- Error handling with automatic cleanup

## Basic Structure

### Plugin Structure
```
my-python-plugin/
├── plugin.json          # Plugin manifest
└── main.py             # Python script
```

### Manifest Configuration

#### Auto-executing Script
```json
{
  "id": "auto-python-script",
  "name": "Auto Python Script",
  "description": "This script runs automatically when loaded",
  "type": "python-script",
  "on": ["onStart"]
}
```

#### Manual Script
```json
{
  "id": "manual-python-script", 
  "name": "Manual Python Script",
  "description": "This script requires manual execution",
  "type": "python-script"
}
```

## Accessing Eagle Context

### Environment Variable
Eagle context is passed via the `POWEREAGLE_CONTEXT` environment variable as a JSON string.

### Context Structure
```json
{
  "folders": [...],     // Selected folders with full properties
  "items": [...],       // Selected items with full properties  
  "info": {...},        // Library info (name, path, folders, etc.)
  "webtoken": "..."     // Web API token
}
```

### Python Implementation
```python
import os
import json

# Get Eagle context
context_json = os.environ.get('POWEREAGLE_CONTEXT', '{}')
context = json.loads(context_json)

# Extract data
selected_folders = context.get('folders', [])
selected_items = context.get('items', [])
library_info = context.get('info', {})
web_token = context.get('webtoken', '')
```

## Examples

### Basic Information Display
```python
import os
import json

# Get Eagle context
context_json = os.environ.get('POWEREAGLE_CONTEXT', '{}')
context = json.loads(context_json)

# Display library information
library_info = context.get('info', {})
print(f"📚 Library: {library_info.get('name', 'Unknown')}")
print(f"📁 Path: {library_info.get('path', 'Unknown')}")
print(f"🗂️ Total folders: {len(library_info.get('folders', []))}")

# Display selected items
selected_items = context.get('items', [])
print(f"\n🔍 Selected items: {len(selected_items)}")

for item in selected_items:
    print(f"  • {item['name']} ({item['ext']})")
    print(f"    Size: {item['width']}x{item['height']}")
    print(f"    Tags: {', '.join(item['tags']) if item['tags'] else 'None'}")
```

### File Processing
```python
import os
import json
from pathlib import Path

# Get Eagle context
context_json = os.environ.get('POWEREAGLE_CONTEXT', '{}')
context = json.loads(context_json)

# Process selected items
selected_items = context.get('items', [])

for item in selected_items:
    file_path = item.get('filePath', '')
    if file_path and Path(file_path).exists():
        file_size = Path(file_path).stat().st_size
        print(f"Processing: {item['name']}")
        print(f"  File size: {file_size:,} bytes")
        print(f"  Extension: {item['ext']}")
        
        # Add your processing logic here
        # For example: image manipulation, metadata extraction, etc.
```

### Tag Analysis
```python
import os
import json
from collections import Counter

# Get Eagle context
context_json = os.environ.get('POWEREAGLE_CONTEXT', '{}')
context = json.loads(context_json)

# Analyze tags across selected items
selected_items = context.get('items', [])

# Collect all tags
all_tags = []
for item in selected_items:
    all_tags.extend(item.get('tags', []))

# Count tag frequency
tag_counter = Counter(all_tags)

print("🏷️ Tag Analysis:")
print(f"Total items: {len(selected_items)}")
print(f"Unique tags: {len(tag_counter)}")
print(f"Total tag instances: {sum(tag_counter.values())}")

print("\nMost common tags:")
for tag, count in tag_counter.most_common(10):
    print(f"  {tag}: {count}")
```

### External API Integration
```python
import os
import json
import requests

# Get Eagle context
context_json = os.environ.get('POWEREAGLE_CONTEXT', '{}')
context = json.loads(context_json)

# Use web token for API calls
web_token = context.get('webtoken', '')
library_info = context.get('info', {})

if web_token:
    print("🌐 Web token available for API integration")
    print(f"Library: {library_info.get('name', 'Unknown')}")
    
    # Example: Use the token for external service integration
    # headers = {'Authorization': f'Bearer {web_token}'}
    # response = requests.get('https://api.example.com/data', headers=headers)
else:
    print("❌ No web token available")
```

## Best Practices

### Error Handling
```python
import os
import json
import sys

try:
    # Get Eagle context
    context_json = os.environ.get('POWEREAGLE_CONTEXT', '{}')
    context = json.loads(context_json)
    
    # Your script logic here
    
except json.JSONDecodeError as e:
    print(f"❌ Error parsing Eagle context: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}", file=sys.stderr)
    sys.exit(1)
```

### Progress Reporting
```python
import os
import json
import time

# Get Eagle context
context_json = os.environ.get('POWEREAGLE_CONTEXT', '{}')
context = json.loads(context_json)

selected_items = context.get('items', [])
total_items = len(selected_items)

print(f"🚀 Starting processing of {total_items} items...")

for i, item in enumerate(selected_items, 1):
    print(f"📄 Processing item {i}/{total_items}: {item['name']}")
    
    # Simulate processing time
    time.sleep(0.1)
    
    # Your processing logic here
    
    # Progress indicator
    progress = (i / total_items) * 100
    print(f"   Progress: {progress:.1f}%")

print("✅ Processing complete!")
```

## Advanced Features

### Accessing Nested Folder Structure
```python
def print_folder_tree(folders, indent=0):
    """Recursively print folder structure"""
    for folder in folders:
        prefix = "  " * indent
        print(f"{prefix}📁 {folder['name']} (ID: {folder['id']})")
        
        # Print children if they exist
        children = folder.get('children', [])
        if children:
            print_folder_tree(children, indent + 1)

# Get Eagle context
context_json = os.environ.get('POWEREAGLE_CONTEXT', '{}')
context = json.loads(context_json)

# Print library folder structure
library_info = context.get('info', {})
library_folders = library_info.get('folders', [])

print("📚 Library Folder Structure:")
print_folder_tree(library_folders)
```

### Item Filtering and Analysis
```python
import os
import json
from datetime import datetime

# Get Eagle context
context_json = os.environ.get('POWEREAGLE_CONTEXT', '{}')
context = json.loads(context_json)

selected_items = context.get('items', [])

# Filter by file type
images = [item for item in selected_items if item['ext'].lower() in ['.jpg', '.png', '.gif', '.bmp']]
videos = [item for item in selected_items if item['ext'].lower() in ['.mp4', '.avi', '.mov', '.mkv']]

print(f"📊 File Type Analysis:")
print(f"  Images: {len(images)}")
print(f"  Videos: {len(videos)}")
print(f"  Other: {len(selected_items) - len(images) - len(videos)}")

# Analyze by import date
print(f"\n📅 Import Date Analysis:")
for item in sorted(selected_items, key=lambda x: x.get('importedAt', 0))[:5]:
    import_time = item.get('importedAt', 0)
    if import_time:
        date = datetime.fromtimestamp(import_time / 1000)  # Convert from milliseconds
        print(f"  {item['name']}: {date.strftime('%Y-%m-%d %H:%M')}")
```

## Troubleshooting

### Common Issues

1. **No Context Data**: Ensure the script is running as a Python script plugin, not a regular Python file
2. **JSON Parse Error**: Check that `POWEREAGLE_CONTEXT` environment variable exists
3. **Missing Dependencies**: Install required Python packages in your environment
4. **Encoding Issues**: Use UTF-8 encoding for text processing

### Debugging
```python
import os
import json

# Debug Eagle context
context_json = os.environ.get('POWEREAGLE_CONTEXT')
if context_json:
    print("✅ Eagle context found")
    try:
        context = json.loads(context_json)
        print(f"📊 Context keys: {list(context.keys())}")
        print(f"📁 Folders: {len(context.get('folders', []))}")
        print(f"📄 Items: {len(context.get('items', []))}")
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
else:
    print("❌ No Eagle context found")
    print("Environment variables:")
    for key, value in os.environ.items():
        if 'EAGLE' in key.upper():
            print(f"  {key}: {value[:100]}...")
```

## Resources

- [Eagle API Documentation](https://github.com/eagle-cooler/eagle-api)
- [Python Environment Setup](https://www.python.org/downloads/)
- [JSON Processing in Python](https://docs.python.org/3/library/json.html)
- [File Operations in Python](https://docs.python.org/3/library/pathlib.html)