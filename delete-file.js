const fs = require('fs');

// File to delete
const fileToDelete = 'src/app/(dashboard)/dashboard/predictive-analytics/page.tsx';

try {
  if (fs.existsSync(fileToDelete)) {
    fs.unlinkSync(fileToDelete);
    console.log(`Successfully deleted ${fileToDelete}`);
  } else {
    console.log(`File ${fileToDelete} does not exist`);
  }
} catch (error) {
  console.error(`Error deleting file: ${error.message}`);
} 