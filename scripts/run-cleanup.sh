#!/bin/bash

echo "=== MarketSage Project Cleanup ==="
echo "This script will move unnecessary files to a backup directory."
echo "Please make sure you have committed your changes to git before proceeding."
echo ""
echo "Do you want to continue? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  # Make scripts executable
  chmod +x cleanup-project.sh cleanup-scripts-dir.sh
  
  # Run cleanup scripts
  echo ""
  echo "Running project cleanup..."
  ./cleanup-project.sh
  
  echo ""
  echo "Running scripts directory cleanup..."
  ./cleanup-scripts-dir.sh
  
  echo ""
  echo "=== Cleanup Complete ==="
  echo "All unnecessary files have been moved to the backup directory."
  echo "Please verify that your application still works correctly."
  echo ""
  echo "After verification, you can delete the backup directory with:"
  echo "rm -rf backup"
  echo ""
  echo "You can also delete the cleanup scripts with:"
  echo "rm cleanup-project.sh cleanup-scripts-dir.sh run-cleanup.sh CLEANUP-README.md"
else
  echo "Cleanup cancelled."
fi 