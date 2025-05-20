#!/bin/bash

echo "🔧 Fixing database connections in seed scripts..."

# Define the pattern to search for and its replacement
SEARCH_PATTERN="postgresql://marketsage:marketsage_password@localhost:5432/marketsage"
REPLACE_PATTERN="process.env.DATABASE_URL || \"postgresql://marketsage:marketsage_password@db:5432/marketsage?schema=public\""

# Find all seed scripts and update them
for script in src/scripts/seed*.ts src/scripts/seed*.js
do
  if [ -f "$script" ]; then
    echo "Updating $script..."
    # Replace the hardcoded connection string with flexible one
    sed -i.bak "s|$SEARCH_PATTERN|$REPLACE_PATTERN|g" "$script"
    # Add logging
    sed -i.bak '/const prisma = new PrismaClient/i \
console.log(`Connecting to database with URL pattern: ${databaseUrl.replace(/password.*@/, "password@")}`);' "$script"
  fi
done

# Remove backup files
rm -f src/scripts/*.bak

echo "✅ Updated database connections in seed scripts"

# Now copy scripts to the root scripts folder for Docker compatibility
echo "📋 Copying scripts to scripts/ directory for Docker compatibility..."
mkdir -p scripts
cp -r src/scripts/* scripts/

echo "🔄 Creating symlinks for backward compatibility..."
# Create symlinks for backward compatibility
for script in scripts/*
do
  base_script=$(basename "$script")
  if [ ! -f "src/scripts/$base_script" ]; then
    ln -sf "../$script" "src/scripts/$base_script"
  fi
done

echo "✅ All seed scripts updated and copied for compatibility!" 