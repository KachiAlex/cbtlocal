#!/bin/bash

# Full-Stack Deployment Script
# This script deploys the CBT app with backend and database

echo "🚀 Deploying CBT App (Full Stack)..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install all dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build both frontend and backend
echo "🔨 Building application..."
npm run build

# Option 1: Docker deployment (recommended)
if [ "$1" = "docker" ]; then
    echo "🐳 Deploying with Docker (Full Stack)..."
    docker-compose up -d
    echo "✅ Full stack deployed!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔗 Backend API: http://localhost:5000"
    echo "📊 MongoDB: localhost:27017"
    
# Option 2: Local development
elif [ "$1" = "dev" ]; then
    echo "🛠️ Starting development environment..."
    npm run dev
    
# Option 3: Production deployment
elif [ "$1" = "prod" ]; then
    echo "🏭 Deploying production environment..."
    docker-compose --profile production up -d
    echo "✅ Production deployment completed!"
    echo "🌐 Application: http://localhost"
    
else
    echo "Usage: $0 [docker|dev|prod]"
    echo "  docker  - Deploy with Docker (recommended)"
    echo "  dev     - Start development environment"
    echo "  prod    - Deploy production with nginx"
    exit 1
fi

echo "🎉 Full-stack deployment completed!"
echo "📝 Note: This version uses MongoDB for data storage" 