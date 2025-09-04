#!/bin/bash

# Frontend-Only Deployment Script
# This script deploys the CBT app without backend (using localStorage)

echo "🚀 Deploying CBT App (Frontend Only)..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Option 1: Docker deployment
if [ "$1" = "docker" ]; then
    echo "🐳 Deploying with Docker (Frontend Only)..."
    docker-compose up frontend -d
    echo "✅ Frontend deployed at http://localhost:3000"
    
# Option 2: Local server
elif [ "$1" = "local" ]; then
    echo "🏠 Deploying with local server..."
    cd frontend
    npx serve -s build -l 3000
    cd ..
    
# Option 3: Cloud deployment
elif [ "$1" = "cloud" ]; then
    echo "☁️ Preparing for cloud deployment..."
    echo "📤 Push to git repository to deploy to Netlify/Vercel"
    git add .
    git commit -m "Deploy frontend-only version"
    git push origin master
    
else
    echo "Usage: $0 [docker|local|cloud]"
    echo "  docker  - Deploy with Docker (recommended)"
    echo "  local   - Deploy with local server"
    echo "  cloud   - Deploy to cloud (Netlify/Vercel)"
    exit 1
fi

echo "🎉 Frontend-only deployment completed!"
echo "📝 Note: This version uses localStorage for data storage" 