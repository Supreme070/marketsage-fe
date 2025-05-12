#!/bin/bash

# Change to the src/scripts directory
cd src/scripts

# Find all TS files in the directory
for file in *.ts; do
  # Skip if not a file
  [ -f "$file" ] || continue

  echo "Updating $file..."

  # Replace localhost:5432 with db:5432 in all TypeScript files
  sed -i 's/localhost:5432/db:5432/g' "$file"
done

echo "Connection strings updated successfully!" 