# Power Eagle SDK Reference

The Power Eagle SDK provides a comprehensive set of tools and APIs for creating userscript-style plugins that extend Eagle.cool functionality with minimal setup. Power Eagle brings the **Tampermonkey experience** to Eagle - simple scripts that can be installed instantly from URLs.

All plugins receive a `context` object containing both Eagle's native API and Power Eagle's enhanced SDK with organized namespaces.

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
  "name": "My Plugin",
  "description": "A brief description of what this plugin does",
  "type": "standard"
}
```

For Python script plugins:

```json
{
  "id": "my-python-plugin",
  "name": "My Python Plugin", 
  "description": "A Python script that responds to Eagle events",
  "type": "python-script",
  "on": ["itemChange", "libraryChange"],
  "pythonEnv": "/path/to/python"
}
```

### Plugin Function (`main.js`)

```javascript
const plugin = async (context) => {
  const { eagle, powersdk } = context;
  
  // Access SDK features through organized namespaces
  // Visual components
  const dialog = new powersdk.visual.Dialog();
  const cardManager = new powersdk.visual.CardManager(container);
  const button = new powersdk.visual.Button(element, options);
  
  // Utility functions
  const success = await powersdk.utils.files.createFile('example', 'txt', 'content');
  const downloadPath = await powersdk.utils.paths.getDownloadPath();
  await powersdk.utils.dom.copyToClipboard('text');
  
  // Storage and core functionality
  powersdk.storage.set('key', 'value');
  powersdk.container.innerHTML = '<div>Plugin UI</div>';
  
  // Eagle API
  await powersdk.webapi.library.switch('/path/to/library');
  
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

#### Storage (`powersdk.storage`)
Isolated localStorage with plugin-specific prefixes:

```javascript
// Set data
powersdk.storage.set('key', 'value');

// Get data
const value = powersdk.storage.get('key');

// Remove data
powersdk.storage.remove('key');

// Clear all plugin data
powersdk.storage.clear();
```

#### Container (`powersdk.container`)
Isolated DOM element for your plugin's UI:

```javascript
// Append elements to your plugin's container
powersdk.container.appendChild(myElement);

// Clear the container
powersdk.container.innerHTML = '';
```

#### Visual Components (`powersdk.visual`)

##### CardManager (`powersdk.visual.CardManager`)
Rich UI component for creating complex layouts:

```javascript
// Create card manager instance
const cardManager = new powersdk.visual.CardManager(containerElement);

// Add a card
cardManager.addCardToContainer({
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

// Clear all cards
cardManager.clearCards();

// Remove specific card
cardManager.removeCard('my-card');
```

##### Dialog (`powersdk.visual.Dialog`)
Modal dialog component for user input:

```javascript
const dialog = new powersdk.visual.Dialog();

const elements = [
  {
    type: 'heading',
    text: 'Enter Details'
  },
  {
    type: 'input',
    id: 'user-input',
    inputType: 'text',
    placeholder: 'Enter text here...',
    class: 'input input-bordered'
  }
];

dialog.open(
  elements,
  (data) => {
    // Handle form submission
    console.log('User input:', data['user-input']);
  },
  () => {
    // Handle dialog close
    console.log('Dialog closed');
  }
);
```

##### Button (`powersdk.visual.Button`)
Enhanced button component:

```javascript
const button = new powersdk.visual.Button(buttonElement, {
  onClick: () => console.log('Button clicked!'),
  variant: 'primary'
});
```

#### Utility Functions (`powersdk.utils`)

##### File Operations (`powersdk.utils.files`)
```javascript
// Create a new file in Eagle
const success = await powersdk.utils.files.createFile('filename', 'txt', 'content');

// Extract zip files
await powersdk.utils.files.extractZip('/path/to/file.zip', '/extract/to/');

// Format file sizes
const formatted = powersdk.utils.files.formatBytes(1024); // "1 KB"
```

##### Path Operations (`powersdk.utils.paths`)
```javascript
// Get system paths
const homePath = await powersdk.utils.paths.getUserHomeDirectory();
const downloadPath = await powersdk.utils.paths.getDownloadPath();
const extensionsPath = await powersdk.utils.paths.getExtensionsPath();
```

##### DOM Operations (`powersdk.utils.dom`)
```javascript
// Create elements
const element = powersdk.utils.dom.createElement('div', { class: 'my-class' });

// Copy to clipboard
await powersdk.utils.dom.copyToClipboard('text to copy');

// Add stylesheets
powersdk.utils.dom.addStylesheet('style-id', '.my-class { color: red; }');
```

##### Common Utilities (`powersdk.utils.common`)
```javascript
// Debounce and throttle
const debouncedFn = powersdk.utils.common.debounce(() => console.log('Debounced!'), 300);
const throttledFn = powersdk.utils.common.throttle(() => console.log('Throttled!'), 1000);

// Generate unique IDs
const id = powersdk.utils.common.generateId('prefix'); // "prefix-1234567890-abc123"

// Validate URLs
const isValid = powersdk.utils.common.isValidUrl('https://example.com'); // true
```

#### Eagle API (`powersdk.webapi`)
Access to Eagle's HTTP API:

```javascript
// Switch libraries
await powersdk.webapi.library.switch('/path/to/library');

// Library operations
const info = await powersdk.webapi.library.info();
```
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
