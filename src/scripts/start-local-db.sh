#!/bin/bash

# Configuration
CONTAINER_NAME="marketsage-postgres"
DB_NAME="marketsage"
DB_USER="marketsage"
DB_PASSWORD="marketsage_password"
DB_PORT="5432"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting local PostgreSQL database for MarketSage development...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    # Check if container is running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${GREEN}Database container is already running.${NC}"
    else
        echo -e "${YELLOW}Database container exists but is not running. Starting it...${NC}"
        docker start ${CONTAINER_NAME}

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Database container started successfully.${NC}"
        else
            echo -e "${RED}Failed to start existing database container.${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}Creating and starting new database container...${NC}"
    docker run --name ${CONTAINER_NAME} \
        -e POSTGRES_PASSWORD=${DB_PASSWORD} \
        -e POSTGRES_USER=${DB_USER} \
        -e POSTGRES_DB=${DB_NAME} \
        -p ${DB_PORT}:5432 \
        -d postgres:15-alpine

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Database container created and started successfully.${NC}"
    else
        echo -e "${RED}Failed to create database container.${NC}"
        exit 1
    fi
fi

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
for i in {1..30}; do
    if docker exec ${CONTAINER_NAME} pg_isready -U ${DB_USER} > /dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL is ready!${NC}"
        break
    fi

    if [ $i -eq 30 ]; then
        echo -e "${RED}Timed out waiting for PostgreSQL to be ready.${NC}"
        exit 1
    fi

    echo -n "."
    sleep 1
done

echo ""
echo -e "${GREEN}Database is ready to use with the following connection details:${NC}"
echo -e "  Host:     ${YELLOW}localhost${NC}"
echo -e "  Port:     ${YELLOW}${DB_PORT}${NC}"
echo -e "  Database: ${YELLOW}${DB_NAME}${NC}"
echo -e "  Username: ${YELLOW}${DB_USER}${NC}"
echo -e "  Password: ${YELLOW}${DB_PASSWORD}${NC}"
echo ""
echo -e "Connection string: ${YELLOW}postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}${NC}"
echo ""
echo -e "${YELLOW}To stop the database:${NC} docker stop ${CONTAINER_NAME}"
echo -e "${YELLOW}To start it again:${NC} docker start ${CONTAINER_NAME}"
echo -e "${YELLOW}To remove it:${NC} docker rm -f ${CONTAINER_NAME}"
echo ""

exit 0
