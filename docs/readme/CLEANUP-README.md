# Project Cleanup Guide

This guide explains the cleanup process for the MarketSage project to remove unnecessary files and scripts.

## Overview

The project contains several redundant files that were created during development but are not needed for production. These include:

1. Multiple Docker configuration files when only `Dockerfile.prod` and `docker-compose.prod.yml` are needed
2. Various start scripts created due to terminal issues
3. Debug and test files
4. Redundant seed scripts
5. System files like `.DS_Store`

## Cleanup Scripts

Two scripts have been created to help with the cleanup process:

1. `cleanup-project.sh` - Moves unnecessary files from the root directory to a backup folder
2. `cleanup-scripts-dir.sh` - Moves unnecessary files from the `scripts` directory to a backup folder

## How to Use

1. Make the scripts executable:
   ```bash
   chmod +x cleanup-project.sh cleanup-scripts-dir.sh
   ```

2. Run the cleanup scripts:
   ```bash
   ./cleanup-project.sh
   ./cleanup-scripts-dir.sh
   ```

3. Verify that the application still works correctly with the remaining files.

4. Once verified, you can permanently delete the backup directory:
   ```bash
   rm -rf backup
   ```

## Files Being Moved to Backup

### Docker-related files
- Dockerfile.dev (using Dockerfile.prod instead)
- docker-compose.db-only.yml (using docker-compose.prod.yml instead)

### Redundant scripts
- start-docker.js
- docker-start.js
- docker-logs.js
- docker-commands.js
- check-docker.js
- restart-docker.js
- check-logs.js
- get-logs.js
- check-status.js
- check-files.js
- start-local.sh
- start-optimized.sh
- run-all-seeds.sh
- seed-locally.sh
- fix-prisma.sh
- fix-prisma-hanging.sh
- fix-seed-connections.sh
- fix-db-connection.sh
- fix-bcrypt.sh

### Debug/test files
- debug-journey.js
- clean-predictive-analytics.js
- delete-file.js
- query.sql
- dev_server.log
- prisma_studio.log
- .DS_Store files

### Redundant seed scripts
- direct-seed.js
- manual-seed.js
- run-seed.sh
- seed-db.sh
- create_user.sql

## After Cleanup

After cleanup, the project will contain only the necessary files for production, making it more maintainable and easier to understand.