const fs = require('fs');
const path = require('path');

const preCommitContent = `#!/bin/sh

# Run the manifest check
node .github/scripts/check-manifest.cjs

# Capture the exit code
RESULT=$?

# If the check failed, prevent the commit
if [ $RESULT -ne 0 ]; then
  echo "❌ Commit aborted due to manifest.json check failure"
  exit 1
fi

# Allow the commit to proceed
exit 0`;

const postCommitContent = `#!/bin/sh

# Restore original manifest value
node .github/scripts/restore-manifest.cjs`;

const preCommitPath = path.join(__dirname, '..', '..', '.git', 'hooks', 'pre-commit');
const postCommitPath = path.join(__dirname, '..', '..', '.git', 'hooks', 'post-commit');

try {
  // Check if .git/hooks directory exists
  const hooksDir = path.dirname(preCommitPath);
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  // Check if hooks already exist
  const hooksExist = fs.existsSync(preCommitPath) || fs.existsSync(postCommitPath);
  if (hooksExist) {
    console.log('⚠️  Git hooks already exist. Do you want to overwrite them? (y/n)');
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y') {
        installHooks();
      } else {
        console.log('Setup cancelled.');
        process.exit(0);
      }
    });
  } else {
    installHooks();
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

function installHooks() {
  try {
    // Install pre-commit hook
    fs.writeFileSync(preCommitPath, preCommitContent);
    console.log('✅ Pre-commit hook installed successfully!');
    
    // Install post-commit hook
    fs.writeFileSync(postCommitPath, postCommitContent);
    console.log('✅ Post-commit hook installed successfully!');
    
    console.log('The hooks will now:');
    console.log('1. Check and fix manifest.json before commit');
    console.log('2. Restore original manifest.json value after commit');
    console.log('To test it, try running: node .github/scripts/check-manifest.cjs');
  } catch (error) {
    console.error('❌ Error installing hooks:', error.message);
    process.exit(1);
  }
} 