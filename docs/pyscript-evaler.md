# Python Script Evaler Documentation

The `PythonScriptEvaler` serves as the responding end to Python callbacks from Eagle Power Eagle plugins. It listens to stderr for specific callback signals and executes the corresponding Eagle API calls.

## How it Works

### 1. Callback Signal Format

Python scripts send callback signals via stderr in this format:
```
$$${api_token}$$${plugin_id}$$${method}(arg1=value1, arg2=value2)
```

Example:
```
$$$abc123$$$my-plugin$$$folder.create(name=New Folder, parent=null)
```

### 2. Signal Processing

The evaler:
1. **Monitors stderr** from Python processes using `pyv2.ts` custom handlers
2. **Filters callback signals** from stderr before passing to original handlers
3. **Parses signals** to extract token, plugin ID, method, and arguments
4. **Validates tokens** against current Eagle API token
5. **Executes Eagle API calls** safely using `coderunner.ts`
6. **Ignores return value methods** listed in `METHODS_WITH_RETURN_VALUES`
7. **Removes callback signals** from final stderr result

### 3. Stderr Handling Behavior

- **$$$ syntax calls**: Consumed by evaler, never printed or logged
- **Non-$$$ stderr**: Passed through normally to original handlers
- **Final result**: `PythonExecutionResult.stderr` has callback signals filtered out
- **Real-time**: Original `onStderr` handlers receive filtered stderr only

### 3. Safe Execution

Uses `asyncExecReadonly` from `coderunner.ts` to:
- Execute API calls in a controlled environment
- Prevent mutations of global objects
- Pass through Eagle API without freezing
- Handle async operations safely

## Stderr Flow Diagram

```
Python Script
    ↓
stderr: "Error message\n$$$token$$$plugin$$$method(...)\nAnother error"
    ↓
PythonScriptEvaler.handleStderrData()
    ↓
Parse & Filter:
- "Error message" → Keep (pass to original handler)
- "$$$token$$$plugin$$$method(...)" → Process & Remove (execute API call)
- "Another error" → Keep (pass to original handler)
    ↓
Filtered stderr: "Error message\nAnother error"
    ↓
Original onStderr handler (if provided)
    ↓
Final result.stderr: "Error message\nAnother error"
```

## Usage Example

### Python Side (using eagle_cooler library)

```python
from eagle_cooler.callback import EagleCallback

# This will send a callback signal to create a folder
EagleCallback.folder.create(name="My New Folder", parent=None)

# This will send a callback signal to show a notification
EagleCallback.notification.show(
    title="Hello",
    description="This is a test notification"
)
```

### TypeScript Side

```typescript
import { pythonScriptEvaler } from './pyscript-evaler';

// Execute Python script with callback support
const result = await pythonScriptEvaler.executeScriptWithCallbacks(
  '/path/to/script.py',
  {
    pythonEnv: 'python',
    timeout: 30000,
    onStdout: (data) => console.log('Python output:', data),
    onStderr: (data) => console.log('Python stderr:', data) // Callbacks intercepted here
  }
);
```

## Supported Methods

The evaler handles all Eagle API methods **except** those in `METHODS_WITH_RETURN_VALUES` which include:

- `tag.get`, `tag.get_recents`
- `library.info`, `library.get_*`
- `window.get_*`, `window.is_*`
- `app.get_*`, `app.is_*`
- `item.get*`, `item.add_*`
- `folder.get*`, `folder.create*`
- `dialog.show_*`
- `clipboard.*`

These methods require return values and should be handled through direct API calls or a different mechanism.

## Callback Flow

1. **Python Script** → Calls `EagleCallback.method(...)`
2. **Callback Handler** → Sends signal to stderr: `$$$token$$$plugin$$$method(...)`
3. **Evaler** → Intercepts stderr, parses signal
4. **API Executor** → Safely calls `eagle.method(...)` via `asyncExecReadonly`
5. **Result** → Operation completed in Eagle

## Error Handling

- **Invalid signals** are logged and ignored
- **Token mismatches** are rejected for security
- **Method execution errors** are caught and logged
- **Parsing errors** don't crash the process

## Security Features

- **Token validation** ensures only authorized plugins can make calls
- **Safe execution** via `asyncExecReadonly` prevents code injection
- **Method filtering** blocks return-value methods that could cause issues
- **Plugin isolation** via plugin ID validation

## Integration

The evaler is integrated into `PythonScriptRunner` to automatically handle callbacks for all Python script plugins in the Power Eagle system.