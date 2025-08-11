#!/bin/bash

# CNC Optimization Service Deployment Script
# This script automates the build, test, and deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="cnc-optimization-service"
VERSION=$(node -p "require('./package.json').version")
DOCKER_IMAGE="cnc-optimization-service"
DOCKER_TAG="${DOCKER_IMAGE}:${VERSION}"
DOCKER_LATEST="${DOCKER_IMAGE}:latest"

echo -e "${BLUE}🚀 Starting deployment for ${SERVICE_NAME} v${VERSION}${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install it and try again."
    exit 1
fi

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm ci

# Step 2: Run tests
print_status "Running test suite..."
npm test

# Step 3: Run linting
print_status "Running code quality checks..."
npm run lint

# Step 4: Build the application
print_status "Building application..."
npm run build

# Step 5: Build Docker image
print_status "Building Docker image..."
docker build -t $DOCKER_TAG -t $DOCKER_LATEST .

# Step 6: Run container tests
print_status "Testing Docker container..."
docker run --rm -d --name test-container -p 8081:8080 $DOCKER_TAG

# Wait for container to start
sleep 10

# Test health endpoint
if curl -f http://localhost:8081/health > /dev/null 2>&1; then
    print_status "Container health check passed"
else
    print_error "Container health check failed"
    docker stop test-container
    exit 1
fi

# Stop test container
docker stop test-container

# Step 7: Deploy with Docker Compose
print_status "Deploying service..."
docker-compose up -d

# Step 8: Wait for service to be healthy
print_status "Waiting for service to be healthy..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        print_status "Service is healthy and responding"
        break
    fi
    
    counter=$((counter + 5))
    sleep 5
    echo -n "."
done

if [ $counter -eq $timeout ]; then
    print_error "Service failed to become healthy within ${timeout} seconds"
    docker-compose logs $SERVICE_NAME
    exit 1
fi

# Step 9: Run smoke tests
print_status "Running smoke tests..."
sleep 5

# Test optimization endpoint
TEST_RESPONSE=$(curl -s -X POST http://localhost:8080/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "pieces": [
      {"id": "test1", "length": 100, "width": 50, "quantity": 1, "canRotate": true}
    ],
    "panel": {"length": 200, "width": 100},
    "settings": {"kerf": 3.2, "padding": {"left": 5, "right": 5, "top": 5, "bottom": 5}}
  }')

if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
    print_status "Optimization endpoint test passed"
else
    print_warning "Optimization endpoint test failed: $TEST_RESPONSE"
fi

# Step 10: Display deployment information
echo ""
echo -e "${BLUE}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}Service: ${SERVICE_NAME} v${VERSION}${NC}"
echo -e "${BLUE}Status: Running on http://localhost:8080${NC}"
echo -e "${BLUE}Health: http://localhost:8080/health${NC}"
echo -e "${BLUE}Docker Image: ${DOCKER_TAG}${NC}"
echo ""

# Display running containers
print_status "Running containers:"
docker-compose ps

# Display logs
print_status "Recent logs:"
docker-compose logs --tail=20 $SERVICE_NAME

echo ""
print_status "Deployment script completed successfully!"
print_status "Use 'docker-compose logs -f $SERVICE_NAME' to monitor logs"
print_status "Use 'docker-compose down' to stop the service"