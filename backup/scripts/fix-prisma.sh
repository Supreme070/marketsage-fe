#!/bin/bash

echo "Stopping existing containers..."
docker-compose down

echo "Cleaning any previous build artifacts..."
rm -rf .next
rm -rf src/generated/prisma

echo "Rebuilding containers with platform targeting..."
docker-compose build --no-cache

echo "Starting containers..."
docker-compose up -d

echo "Waiting for database to be ready..."
sleep 10

echo "Generating Prisma client..."
docker-compose exec web npm run db:generate

echo "Running migrations..."
docker-compose exec web npm run db:migrate

echo "Updating user passwords..."
docker-compose exec web npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/update-passwords.ts

echo "All done! The application should now be accessible at http://localhost:3030"
echo ""
echo "Login with any of the following accounts:"
echo "- Email: supreme@marketsage.africa, Password: MS_Super2025!"
echo "- Email: admin@marketsage.local, Password: password1234" 