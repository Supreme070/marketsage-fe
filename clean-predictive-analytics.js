const fs = require('fs');

// Paths to delete
const pathsToDelete = [
  'src/app/dashboard/predictive-analytics',
  'src/app/dashboard/predictive-analytics/page.tsx',
  'src/app/(dashboard)/dashboard/predictive-analytics/page.tsx'
];

pathsToDelete.forEach(path => {
  try {
    if (fs.existsSync(path)) {
      const stats = fs.statSync(path);
      if (stats.isDirectory()) {
        console.log(`Removing directory: ${path}`);
        fs.rmSync(path, { recursive: true, force: true });
      } else {
        console.log(`Removing file: ${path}`);
        fs.unlinkSync(path);
      }
      console.log(`Successfully removed: ${path}`);
    } else {
      console.log(`Path does not exist: ${path}`);
    }
  } catch (error) {
    console.error(`Error removing ${path}:`, error.message);
  }
}); 