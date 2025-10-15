#!/bin/bash

# Create backup directories
mkdir -p backup/docker
mkdir -p backup/scripts
mkdir -p backup/logs
mkdir -p backup/misc

echo "Moving unnecessary Docker files to backup/docker..."
# Docker-related files
mv Dockerfile.dev backup/docker/ 2>/dev/null || echo "Dockerfile.dev not found"
mv docker-compose.db-only.yml backup/docker/ 2>/dev/null || echo "docker-compose.db-only.yml not found"

echo "Moving unnecessary script files to backup/scripts..."
# Redundant scripts
mv start-docker.js backup/scripts/ 2>/dev/null || echo "start-docker.js not found"
mv docker-start.js backup/scripts/ 2>/dev/null || echo "docker-start.js not found"
mv docker-logs.js backup/scripts/ 2>/dev/null || echo "docker-logs.js not found"
mv docker-commands.js backup/scripts/ 2>/dev/null || echo "docker-commands.js not found"
mv check-docker.js backup/scripts/ 2>/dev/null || echo "check-docker.js not found"
mv restart-docker.js backup/scripts/ 2>/dev/null || echo "restart-docker.js not found"
mv check-logs.js backup/scripts/ 2>/dev/null || echo "check-logs.js not found"
mv get-logs.js backup/scripts/ 2>/dev/null || echo "get-logs.js not found"
mv check-status.js backup/scripts/ 2>/dev/null || echo "check-status.js not found"
mv check-files.js backup/scripts/ 2>/dev/null || echo "check-files.js not found"
mv start-local.sh backup/scripts/ 2>/dev/null || echo "start-local.sh not found"
mv start-optimized.sh backup/scripts/ 2>/dev/null || echo "start-optimized.sh not found"
mv run-all-seeds.sh backup/scripts/ 2>/dev/null || echo "run-all-seeds.sh not found"
mv seed-locally.sh backup/scripts/ 2>/dev/null || echo "seed-locally.sh not found"
mv fix-prisma.sh backup/scripts/ 2>/dev/null || echo "fix-prisma.sh not found"
mv fix-prisma-hanging.sh backup/scripts/ 2>/dev/null || echo "fix-prisma-hanging.sh not found"
mv fix-seed-connections.sh backup/scripts/ 2>/dev/null || echo "fix-seed-connections.sh not found"
mv fix-db-connection.sh backup/scripts/ 2>/dev/null || echo "fix-db-connection.sh not found"
mv fix-bcrypt.sh backup/scripts/ 2>/dev/null || echo "fix-bcrypt.sh not found"

echo "Moving debug/test files to backup/misc..."
# Debug/test files
mv debug-journey.js backup/misc/ 2>/dev/null || echo "debug-journey.js not found"
mv clean-predictive-analytics.js backup/misc/ 2>/dev/null || echo "clean-predictive-analytics.js not found"
mv delete-file.js backup/misc/ 2>/dev/null || echo "delete-file.js not found"
mv query.sql backup/misc/ 2>/dev/null || echo "query.sql not found"

echo "Moving log files to backup/logs..."
# Log files
mv dev_server.log backup/logs/ 2>/dev/null || echo "dev_server.log not found"
mv prisma_studio.log backup/logs/ 2>/dev/null || echo "prisma_studio.log not found"

echo "Moving redundant seed scripts to backup/scripts..."
# Redundant seed scripts
mv direct-seed.js backup/scripts/ 2>/dev/null || echo "direct-seed.js not found"
mv manual-seed.js backup/scripts/ 2>/dev/null || echo "manual-seed.js not found"
mv run-seed.sh backup/scripts/ 2>/dev/null || echo "run-seed.sh not found"
mv seed-db.sh backup/scripts/ 2>/dev/null || echo "seed-db.sh not found"
mv create_user.sql backup/scripts/ 2>/dev/null || echo "create_user.sql not found"

# Find and remove .DS_Store files
echo "Finding and moving .DS_Store files..."
find . -name ".DS_Store" -type f -exec mv {} backup/misc/ \; 2>/dev/null || echo "No .DS_Store files found"

echo "Cleanup completed. All files have been moved to the backup directory."
echo "Please verify your application still works correctly before deleting the backup directory."
echo ""
echo "To delete the backup directory after verification, run:"
echo "rm -rf backup" 