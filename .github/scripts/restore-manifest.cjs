const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', '..', 'manifest.json');
const tempPath = path.join(__dirname, '..', '..', '.git', 'manifest-original.json');

try {
  // Check if we have a stored original value
  if (fs.existsSync(tempPath)) {
    const original = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Restore original value
    manifest.devTools = original.devTools;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    
    // Clean up temp file
    fs.unlinkSync(tempPath);
    
    console.log('✅ Original manifest.json value restored');
  }
} catch (error) {
  console.error('❌ Error restoring manifest.json:', error.message);
  process.exit(1);
} 