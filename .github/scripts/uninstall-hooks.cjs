const fs = require('fs');
const path = require('path');

const preCommitPath = path.join(__dirname, '..', '..', '.git', 'hooks', 'pre-commit');
const postCommitPath = path.join(__dirname, '..', '..', '.git', 'hooks', 'post-commit');
const tempPath = path.join(__dirname, '..', '..', '.git', 'manifest-original.json');

try {
  let hooksRemoved = false;

  // Remove pre-commit hook
  if (fs.existsSync(preCommitPath)) {
    fs.unlinkSync(preCommitPath);
    console.log('✅ Pre-commit hook removed');
    hooksRemoved = true;
  }

  // Remove post-commit hook
  if (fs.existsSync(postCommitPath)) {
    fs.unlinkSync(postCommitPath);
    console.log('✅ Post-commit hook removed');
    hooksRemoved = true;
  }

  // Clean up any leftover temp file
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
    console.log('✅ Cleaned up temporary manifest file');
  }

  if (!hooksRemoved) {
    console.log('ℹ️  No hooks were found to remove');
  } else {
    console.log('✅ All hooks have been uninstalled');
  }
} catch (error) {
  console.error('❌ Error uninstalling hooks:', error.message);
  process.exit(1);
} 