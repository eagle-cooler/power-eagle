# Manifest Check Scripts

This directory contains scripts for checking and enforcing the `devTools: false` requirement in `manifest.json`.

## Available Scripts

### Check Manifest
```bash
node .github/scripts/check-manifest.js
```
This script checks if `devTools` is set to `false` in `manifest.json`. It will:
- Exit with code 0 if the check passes
- If `devTools` is not `false`:
  - Store the original value
  - Automatically set it to `false`
  - Stage the changes for commit
  - Show a success message
- Show appropriate error messages if file cannot be read/parsed

### Setup Git Hooks (Optional)
```bash
node .github/scripts/setup-commit.js
```
This script will:
1. Check if git hooks already exist
2. If they exist, ask for confirmation before overwriting
3. Install two hooks:
   - Pre-commit: Checks and fixes manifest.json before commit
   - Post-commit: Restores the original manifest.json value after commit

### Uninstall Git Hooks
```bash
node .github/scripts/uninstall-hooks.js
```
This script will:
1. Remove the pre-commit hook
2. Remove the post-commit hook
3. Clean up any leftover temporary files
4. Show appropriate success/error messages

## Usage

1. To just check and fix the manifest:
   ```bash
   node .github/scripts/check-manifest.js
   ```
   This will automatically fix `devTools` if needed and stage the changes.

2. To set up the git hooks (optional):
   ```bash
   node .github/scripts/setup-precommit.js
   ```

3. To remove the git hooks:
   ```bash
   node .github/scripts/uninstall-hooks.js
   ```

The hooks will:
1. Before commit: Fix `manifest.json` if needed and stage the changes
2. After commit: Restore the original value of `manifest.json`

This ensures that:
- Commits always have `devTools: false`
- Your working copy maintains its original state
- The process is completely automated 