const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function matchPattern(pattern, filePath) {
  // Handle exact matches
  if (pattern === filePath) return true;
  
  // Handle *xxx (ends with)
  if (pattern.startsWith('*')) {
    const suffix = pattern.slice(1);
    return filePath.endsWith(suffix);
  }
  
  // Handle xxx* (starts with)
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return filePath.startsWith(prefix);
  }
  
  return false;
}

function findMatchingFiles(pattern, baseDir) {
  const matches = [];
  
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (matchPattern(pattern, relativePath)) {
        matches.push(relativePath);
      }
    }
  }
  
  scanDir(baseDir);
  return matches;
}

function createZip(type) {
  const pkgRules = JSON.parse(fs.readFileSync(path.join(process.env.PATH_TO_PACKAGE, '.github/configs/pkgRules.json'), 'utf8'));
  const manifestName = process.env.MANIFEST_NAME;
  const manifestVersion = process.env.MANIFEST_VERSION;
  
  // Create zip command with version in filename
  const zipFileName = `${manifestName}-v${manifestVersion}-${type}.eagleplugin`;
  let zipCmd = `zip -r "${zipFileName}"`;
  
  // Process each include pattern
  pkgRules.includes.forEach(pattern => {
    // Find matching files for the pattern
    const matches = findMatchingFiles(pattern, process.env.PATH_TO_PACKAGE);
    
    // Add each matched file to zip command
    matches.forEach(file => {
      zipCmd += ` "${file}"`;
    });
  });
  
  // Add manifest
  zipCmd += ` "manifest.json"`;
  
  // Execute zip command
  execSync(zipCmd);
  
  return zipFileName;
}

// Only run if this file is being executed directly
if (require.main === module) {
  const type = process.argv[2];
  const zipFile = createZip(type);
  console.log(zipFile);
}

module.exports = { createZip }; 