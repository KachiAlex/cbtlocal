#!/bin/bash

# CBT Local Server Startup Script

echo "🚀 Starting CBT Local Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

# Check if serve is installed globally
if ! command -v serve &> /dev/null; then
    echo "📦 Installing serve globally..."
    npm install -g serve
fi

# Start the server
echo "🌐 Starting server on http://localhost:3000"
echo "📝 Press Ctrl+C to stop the server"
echo ""

serve -s build -l 3000 