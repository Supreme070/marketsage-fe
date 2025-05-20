#!/bin/bash

# Create backup directory for scripts
mkdir -p backup/scripts/redundant

echo "Moving redundant scripts from scripts directory..."

# Check if the scripts directory exists
if [ -d "scripts" ]; then
  # Move test/debug scripts that are not needed in production
  mv scripts/simplified-seed.js backup/scripts/redundant/ 2>/dev/null || echo "simplified-seed.js not found"
  mv scripts/count-users.sql backup/scripts/redundant/ 2>/dev/null || echo "count-users.sql not found"
  mv scripts/test-ai-features.ts backup/scripts/redundant/ 2>/dev/null || echo "test-ai-features.ts not found"
  mv scripts/run-samples.js backup/scripts/redundant/ 2>/dev/null || echo "run-samples.js not found"
  mv scripts/create-sample-whatsapp-data.js backup/scripts/redundant/ 2>/dev/null || echo "create-sample-whatsapp-data.js not found"
  
  # Find and move any other test or debug scripts
  find scripts -name "*test*.js" -o -name "*debug*.js" -o -name "*sample*.js" | xargs -I{} mv {} backup/scripts/redundant/ 2>/dev/null
  
  echo "Scripts directory cleanup completed."
else
  echo "Scripts directory not found."
fi

echo "To delete the backup directory after verification, run:"
echo "rm -rf backup" 