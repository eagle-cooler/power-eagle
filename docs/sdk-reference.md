# Power Eagle SDK Reference

The Power Eagle SDK provides a comprehensive set of tools and APIs for creating userscript plugins that extend Eagle.cool functionality. All plugins receive a `context` object containing both Eagle's native API and Power Eagle's enhanced SDK.

## Plugin Structure

Every Power Eagle plugin follows this simple structure:

```
~user/.powereagle/extensions/{pluginId}/
├── plugin.json          # Plugin manifest
└── main.js             # Plugin implementation
```

### Plugin Manifest (`plugin.json`)

```json
{
  "id": "my-plugin",
  "name": "My Plugin"
}
```

### Plugin Function (`main.js`)

```javascript
const plugin = async (context) => {
  const { eagle, powersdk } = context;
  const { storage, container, CardManager, webapi, pluginId } = powersdk;
  
  // Your plugin implementation here
};
```

## Context Object

The `context` object provides access to both Eagle's native API and Power Eagle's enhanced SDK:

### Eagle API (`eagle`)
- **Native Eagle functionality**: Access to Eagle's built-in APIs
- **Notifications**: `eagle.notification.show({ title, description })`
- **Item Management**: `eagle.item.getSelected()`, `eagle.item.update()`
- **Library Operations**: `eagle.library.switch()`, `eagle.library.info()`

### Power SDK (`powersdk`)

#### Storage (`storage`)
Isolated localStorage with plugin-specific prefixes:

```javascript
// Set data
storage.set('key', 'value');

// Get data
const value = storage.get('key');

// Remove data
storage.remove('key');

// Clear all plugin data
storage.clear();
```

#### Container (`container`)
Isolated DOM element for your plugin's UI:

```javascript
// Append elements to your plugin's container
container.appendChild(myElement);

// Clear the container
container.innerHTML = '';
```

#### CardManager (`CardManager`)
Rich UI component for creating complex layouts:

```javascript
// Create a card
const card = CardManager.createCard({
  id: 'my-card',
  title: 'Card Title',
  subtitle: 'Optional subtitle',
  content: '<p>Card content with HTML</p>',
  status: 'success', // 'default' | 'success' | 'warning' | 'error'
  actions: [
    {
      id: 'action-1',
      text: 'Click Me',
      variant: 'primary', // 'primary' | 'secondary' | 'accent' | 'warning' | 'error'
      onClick: () => console.log('Button clicked!')
    }
  ]
});

// Add card to container
container.appendChild(card);

// Update existing card
CardManager.updateCard('my-card', {
  title: 'Updated Title',
  status: 'warning'
});

// Remove card
CardManager.removeCard('my-card');
```

#### WebAPI (`webapi`)
HTTP client for Eagle's REST API:

```javascript
// Application info
const appInfo = await webapi.application.info();

// Folder operations
const folders = await webapi.folder.list();
const newFolder = await webapi.folder.create('My Folder', parentId);

// Library operations
const libraryInfo = await webapi.library.info();
await webapi.library.switch('/path/to/library');

// Item operations
const items = await webapi.item.list({ limit: 50 });
const itemInfo = await webapi.item.getInfo(itemId);
await webapi.item.update({
  itemId: 'item-id',
  tags: ['tag1', 'tag2'],
  star: 5
});

// Add items
await webapi.item.addFromUrl({
  url: 'https://example.com/image.jpg',
  name: 'My Image',
  tags: ['web']
});
```

#### Plugin ID (`pluginId`)
Unique identifier for your plugin:

```javascript
console.log('Plugin ID:', pluginId);
// Output: "my-plugin"
```

## Utility Functions

Power Eagle provides several utility functions for common tasks:

### DOM Utilities
```javascript
import { createElement, waitForElement, addStylesheet } from './utils';

// Create DOM elements
const button = createElement('button', 'btn btn-primary', 'Click Me');

// Wait for elements to appear
const element = await waitForElement('#my-element');

// Add custom styles
addStylesheet(`
  .my-plugin { color: blue; }
`, 'my-plugin-styles');
```

### Performance Utilities
```javascript
import { debounce, throttle } from './utils';

// Debounce function calls
const debouncedSearch = debounce((query) => {
  // Search logic
}, 300);

// Throttle function calls
const throttledScroll = throttle((event) => {
  // Scroll logic
}, 100);
```

### File Utilities
```javascript
import { formatBytes, generateId, isValidUrl } from './utils';

// Format file sizes
const size = formatBytes(1024); // "1 KB"

// Generate unique IDs
const id = generateId('my-plugin'); // "my-plugin-1234567890-abc123"

// Validate URLs
const isValid = isValidUrl('https://example.com'); // true
```

### Clipboard Utilities
```javascript
import { copyToClipboard } from './utils';

// Copy text to clipboard
await copyToClipboard('Hello World!');
```

## Card Utilities

Power Eagle includes pre-built card patterns for common use cases:

```javascript
import { CardUtils } from './card';

// Library card for displaying library information
const libraryCard = CardUtils.createLibraryCard({
  name: 'My Library',
  path: '/path/to/library',
  dirname: 'library-folder',
  isValid: true
});

// Status card for showing messages
const statusCard = CardUtils.createStatusCard(
  'Success!',
  'Operation completed successfully',
  'success'
);

// Action card with buttons
const actionCard = CardUtils.createActionCard(
  'Quick Actions',
  'Choose an action to perform',
  [
    {
      id: 'action-1',
      text: 'Action 1',
      variant: 'primary',
      onClick: () => console.log('Action 1')
    },
    {
      id: 'action-2',
      text: 'Action 2',
      variant: 'secondary',
      onClick: () => console.log('Action 2')
    }
  ]
);
```

## Error Handling

Always wrap your plugin code in try-catch blocks and provide user feedback:

```javascript
const plugin = async (context) => {
  const { eagle, powersdk } = context;
  const { storage, container, CardManager } = powersdk;

  try {
    // Your plugin logic here
    const data = await webapi.item.list();
    
    // Show success notification
    await eagle.notification.show({
      title: 'Success',
      description: `Found ${data.length} items`
    });
    
  } catch (error) {
    console.error('Plugin error:', error);
    
    // Show error notification
    await eagle.notification.show({
      title: 'Error',
      description: 'Something went wrong. Check the console for details.'
    });
  }
};
```

## Best Practices

1. **Use the container**: Always append your UI elements to the provided `container`
2. **Handle errors**: Wrap async operations in try-catch blocks
3. **Clean up**: Remove event listeners and clear timers when switching plugins
4. **Use storage**: Persist user preferences and data using the isolated storage
5. **Provide feedback**: Use Eagle's notification system to inform users of actions
6. **Test thoroughly**: Test your plugin with different Eagle states and data

## Example Plugins

See the `src/examples/` directory for complete plugin examples:
- **Basic Plugin**: Demonstrates SDK features
- **Recent Libraries**: Complex UI with search and filtering
- **File Counter**: Simple utility plugin

For more examples, check the installed plugins in `~user/.powereagle/extensions/`.
