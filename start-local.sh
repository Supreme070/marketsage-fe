#!/bin/bash

# Stop all Docker containers
docker-compose down

# Start just the database
docker-compose up -d db

# Start the Next.js app locally
NODE_OPTIONS="--max-old-space-size=4096" npm run dev 