# Power Eagle Usage Examples

This document provides practical examples of how to use Power Eagle plugins, based on real-world implementations.

## File Counter Plugin Example

This plugin demonstrates how to create a simple utility that interacts with Eagle's file selection system.

### Plugin Structure

```
file-counter/
├── plugin.json
└── main.js
```

### Plugin Manifest (`plugin.json`)

```json
{
  "id": "file-counter",
  "name": "File Counter",
  "description": "Count and track the number of selected files in Eagle"
}
```

### Plugin Implementation (`main.js`)

```javascript
// Counter Plugin Example for Power Eagle
const plugin = async (context) => {
  const { eagle, powersdk } = context;
  
  console.log('Counter plugin loaded');

  // Create the plugin container
  const pluginContainer = document.createElement('div');
  pluginContainer.className = 'p-6 max-w-md mx-auto';
  pluginContainer.innerHTML = `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body text-center">
        <h2 class="card-title justify-center mb-4">File Counter</h2>
        
        <div class="stats shadow mb-4">
          <div class="stat">
            <div class="stat-title">Selected Files</div>
            <div class="stat-value text-primary" id="counter-display">0</div>
            <div class="stat-desc">Click button to count</div>
          </div>
        </div>
        
        <div class="card-actions justify-center">
          <button class="btn btn-primary" id="count-button">
            📊 Count Selected Files
          </button>
        </div>
        
        <div class="mt-4">
          <button class="btn btn-sm btn-outline" id="reset-button">
            🔄 Reset Counter
          </button>
        </div>
      </div>
    </div>
  `;

  // Append to the main container
  powersdk.container.appendChild(pluginContainer);

  // Get DOM elements
  const counterDisplay = pluginContainer.querySelector('#counter-display');
  const countButton = pluginContainer.querySelector('#count-button');
  const resetButton = pluginContainer.querySelector('#reset-button');

  // Load saved counter value
  const savedCount = powersdk.storage.get('counter') || '0';
  counterDisplay.textContent = savedCount;

  // Count button click handler
  countButton.addEventListener('click', async () => {
    try {
      // Show loading state
      countButton.disabled = true;
      countButton.textContent = '⏳ Counting...';
      
      // Get selected files from Eagle using proper API
      const selectedFiles = await eagle.item.getSelected();
      
      // Update counter
      const newCount = selectedFiles.length;
      counterDisplay.textContent = newCount.toString();
      
      // Save to storage
      powersdk.storage.set('counter', newCount.toString());
      
      // Show success message using Eagle notification API
      await eagle.notification.show({
        title: 'Files Counted',
        description: `Found ${newCount} selected file${newCount !== 1 ? 's' : ''}`
      });
      
    } catch (error) {
      console.error('Failed to count selected files:', error);
      
      // Show error notification
      await eagle.notification.show({
        title: 'Error',
        description: 'Failed to count selected files. Make sure you have files selected in Eagle.'
      });
      
    } finally {
      // Reset button state
      countButton.disabled = false;
      countButton.textContent = '📊 Count Selected Files';
    }
  });

  // Reset button click handler
  resetButton.addEventListener('click', () => {
    counterDisplay.textContent = '0';
    powersdk.storage.set('counter', '0');
  });
};
```

## Key Concepts Demonstrated

### 1. Context Destructuring
```javascript
const { eagle, powersdk } = context;
```
- Extract Eagle's native API and Power Eagle's SDK
- Access organized namespaces: `powersdk.visual`, `powersdk.utils`, `powersdk.storage`
- Use namespace structure: `powersdk.storage.set()`, `powersdk.container.appendChild()`

### 2. UI Creation with TailwindCSS
```javascript
pluginContainer.className = 'p-6 max-w-md mx-auto';
pluginContainer.innerHTML = `
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body text-center">
      <!-- DaisyUI card structure -->
    </div>
  </div>
`;
```
- Use TailwindCSS classes for styling
- Leverage DaisyUI components for consistent design
- Create responsive layouts

### 3. Eagle API Integration
```javascript
const selectedFiles = await eagle.item.getSelected();
await eagle.notification.show({
  title: 'Files Counted',
  description: `Found ${newCount} selected file${newCount !== 1 ? 's' : ''}`
});
```
- Access Eagle's native item selection API
- Use Eagle's notification system for user feedback
- Handle async operations properly

### 4. Persistent Storage
```javascript
// Load saved data
const savedCount = storage.get('counter') || '0';

// Save data
storage.set('counter', newCount.toString());
```
- Use isolated storage for plugin data
- Provide default values for missing data
- Persist user preferences across sessions

### 5. Error Handling
```javascript
try {
  // Plugin logic
} catch (error) {
  console.error('Failed to count selected files:', error);
  
  // Show error notification
  await eagle.notification.show({
    title: 'Error',
    description: 'Failed to count selected files. Make sure you have files selected in Eagle.'
  });
} finally {
  // Reset button state
  countButton.disabled = false;
  countButton.textContent = '📊 Count Selected Files';
}
```
- Wrap async operations in try-catch blocks
- Provide meaningful error messages to users
- Use finally blocks for cleanup

### 6. Loading States
```javascript
// Show loading state
countButton.disabled = true;
countButton.textContent = '⏳ Counting...';

// Reset button state
countButton.disabled = false;
countButton.textContent = '📊 Count Selected Files';
```
- Provide visual feedback during operations
- Disable buttons to prevent multiple clicks
- Reset UI state after completion

## Advanced Usage Patterns

### Using CardManager for Complex UIs

Instead of manually creating HTML, you can use the CardManager:

```javascript
const plugin = async (context) => {
  const { eagle, powersdk } = context;

  // Create card manager instance
  const cardManager = new powersdk.visual.CardManager(powersdk.container);

  // Add a card with actions
  cardManager.addCardToContainer({
    id: 'file-counter-card',
    title: 'File Counter',
    subtitle: 'Count selected files in Eagle',
    content: `
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">Selected Files</div>
          <div class="stat-value text-primary" id="counter-display">0</div>
          <div class="stat-desc">Click button to count</div>
        </div>
      </div>
    `,
    actions: [
      {
        id: 'count',
        text: '📊 Count Files',
        variant: 'primary',
        onClick: async () => {
          const selectedFiles = await eagle.item.getSelected();
          const counterDisplay = powersdk.container.querySelector('#counter-display');
          counterDisplay.textContent = selectedFiles.length.toString();
          
          await eagle.notification.show({
            title: 'Files Counted',
            description: `Found ${selectedFiles.length} selected files`
          });
        }
      },
      {
        id: 'reset',
        text: '🔄 Reset',
        variant: 'secondary',
        onClick: () => {
          const counterDisplay = powersdk.container.querySelector('#counter-display');
          counterDisplay.textContent = '0';
          powersdk.storage.set('counter', '0');
        }
      }
    ]
  });
};
```

### Using WebAPI for Advanced Operations

```javascript
const plugin = async (context) => {
  const { eagle, powersdk } = context;

  try {
    // Get library information
    const libraryInfo = await powersdk.webapi.library.info();
    
    // List recent items
    const recentItems = await webapi.item.list({ 
      limit: 10, 
      orderBy: 'dateCreated' 
    });
    
    // Create a folder
    const newFolder = await webapi.folder.create('My Plugin Folder');
    
    // Add items to the folder
    for (const item of recentItems) {
      await webapi.item.update({
        itemId: item.id,
        folderId: newFolder.id,
        tags: ['plugin-added']
      });
    }
    
    await eagle.notification.show({
      title: 'Success',
      description: `Processed ${recentItems.length} items`
    });
    
  } catch (error) {
    await eagle.notification.show({
      title: 'Error',
      description: 'Failed to process items'
    });
  }
};
```

## Installation and Testing

1. **Create Plugin Directory**:
   ```
   ~user/.powereagle/extensions/file-counter/
   ```

2. **Add Files**:
   - Create `plugin.json` with manifest
   - Create `main.js` with plugin function

3. **Test Plugin**:
   - Open Power Eagle
   - The plugin should appear in the plugin list
   - Click to run and test functionality

4. **Debug**:
   - Check browser console for errors
   - Use `console.log()` for debugging
   - Verify Eagle API calls are working

## Common Issues and Solutions

### Plugin Not Loading
- Check `plugin.json` syntax
- Ensure `main.js` exports a function named `plugin`
- Verify file paths are correct

### UI Not Displaying
- Ensure elements are appended to `container`
- Check TailwindCSS classes are valid
- Verify DOM selectors are correct

### Storage Issues
- Use `storage.get()` with default values
- Check if keys are properly prefixed
- Verify data is being saved correctly
