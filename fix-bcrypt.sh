#!/bin/bash
set -e

echo "Fixing bcrypt architecture issues..."

# Ensure container is running
docker-compose ps | grep marketsage-web > /dev/null
if [ $? -ne 0 ]; then
  echo "Container is not running. Starting services..."
  docker-compose up -d
  echo "Waiting for services to start..."
  sleep 15
fi

# Fix bcrypt in the container
echo "Reinstalling bcrypt with correct architecture..."
docker exec -it marketsage-web sh -c "
  cd /app && 
  npm uninstall bcrypt && 
  npm install bcrypt --no-save && 
  npm rebuild bcrypt --build-from-source
"

# Restart the web container
echo "Restarting web container..."
docker-compose restart web

echo "Waiting for web service to restart..."
sleep 10

echo "Fix completed. Try accessing the application again at http://localhost:3030" 