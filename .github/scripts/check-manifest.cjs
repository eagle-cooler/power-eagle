const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const manifestPath = path.join(__dirname, '..', '..', 'manifest.json');
const tempPath = path.join(__dirname, '..', '..', '.git', 'manifest-original.json');

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  if (manifest.devTools !== false) {
    console.log('⚠️  devTools is not set to false in manifest.json');
    console.log('🔄 Automatically fixing manifest.json...');
    
    // Store original value
    fs.writeFileSync(tempPath, JSON.stringify({ devTools: manifest.devTools }));
    
    // Update manifest.json
    manifest.devTools = false;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    
    // Stage the file for commit
    try {
      execSync('git add manifest.json', { stdio: 'inherit' });
      console.log('✅ manifest.json has been fixed and staged for commit');
      console.log('📝 You can now commit the changes');
      console.log('🔄 Original value will be restored after commit');
    } catch (gitError) {
      console.error('❌ Error staging manifest.json:', gitError.message);
      process.exit(1);
    }
  } else {
    console.log('✅ manifest.json check passed: devTools is set to false');
  }
} catch (error) {
  console.error('❌ Error reading or parsing manifest.json:', error.message);
  process.exit(1);
} 