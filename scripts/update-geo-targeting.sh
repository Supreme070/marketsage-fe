#!/bin/bash

# Exit on error
set -e

echo "Updating geo-targeting components in Docker container..."

# Copy the updated files into the Docker container
docker cp src/components/dashboard/sidebar.tsx marketsage-web-dev:/app/src/components/dashboard/sidebar.tsx
docker cp src/components/geo-targeting/location-segmentation.tsx marketsage-web-dev:/app/src/components/geo-targeting/location-segmentation.tsx
docker cp src/components/geo-targeting/geo-triggered-campaigns.tsx marketsage-web-dev:/app/src/components/geo-targeting/geo-triggered-campaigns.tsx
docker cp src/components/geo-targeting/regional-performance.tsx marketsage-web-dev:/app/src/components/geo-targeting/regional-performance.tsx
docker cp src/components/geo-targeting/local-time-delivery.tsx marketsage-web-dev:/app/src/components/geo-targeting/local-time-delivery.tsx
docker cp src/app/(dashboard)/geo-targeting/page.tsx marketsage-web-dev:/app/src/app/(dashboard)/geo-targeting/page.tsx

echo "Files updated in Docker container"
echo "The app should automatically restart with the new changes"
echo "If not, you may need to run: docker restart marketsage-web-dev" 