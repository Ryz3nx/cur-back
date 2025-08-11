#!/bin/bash

# CNC Optimization Service Startup Script

echo "🚀 Starting CNC Optimization Service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Start the service
echo "🌟 Starting service on http://localhost:8080"
echo "📊 Health check: http://localhost:8080/health"
echo "🔧 Algorithms: http://localhost:8080/algorithms"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

npm start