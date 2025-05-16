const fs = require('fs');
const path = require('path');

// Define paths to check
const paths = [
  'src/app/dashboard/predictive-analytics/page.tsx',
  'src/app/(dashboard)/dashboard/predictive-analytics/page.tsx'
];

// Check each path
paths.forEach(pathToCheck => {
  try {
    const exists = fs.existsSync(pathToCheck);
    const stats = exists ? fs.statSync(pathToCheck) : null;
    const type = stats ? (stats.isDirectory() ? 'directory' : 'file') : 'does not exist';
    
    console.log(`Path: ${pathToCheck}`);
    console.log(`Status: ${type}`);
    if (exists && !stats.isDirectory()) {
      console.log(`Size: ${stats.size} bytes`);
      console.log(`Last modified: ${stats.mtime}`);
    }
    console.log('---');
  } catch (error) {
    console.error(`Error checking ${pathToCheck}:`, error.message);
  }
});

// Recursively list all files in a directory
function listFiles(dir, baseDir = '') {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      const relativePath = path.join(baseDir, file);
      
      if (stats.isDirectory()) {
        console.log(`DIR: ${relativePath}`);
        listFiles(filePath, relativePath);
      } else {
        console.log(`FILE: ${relativePath} (${stats.size} bytes)`);
      }
    });
  } catch (error) {
    console.error(`Error listing ${dir}:`, error.message);
  }
}

// List all files in the dashboard and (dashboard) directories
console.log('\nFiles in src/app/dashboard:');
listFiles('src/app/dashboard', '');

console.log('\nFiles in src/app/(dashboard):');
listFiles('src/app/(dashboard)', ''); 