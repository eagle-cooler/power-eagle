const fs = require('fs');
const path = require('path');

function processManifest(devTools) {
  const manifestPath = path.join(process.env.PATH_TO_PACKAGE, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Store original devTools value
  const originalDevTools = manifest.devTools;
  
  // Update devTools value
  manifest.devTools = devTools;
  
  // Write back to manifest.json
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Return type and original value for potential restoration
  return {
    type: devTools ? 'debug' : 'release',
    originalDevTools
  };
}

// Only run if this file is being executed directly
if (require.main === module) {
  const devTools = process.argv[2] === 'true';
  const result = processManifest(devTools);
  console.log(JSON.stringify(result));
}

module.exports = { processManifest }; 