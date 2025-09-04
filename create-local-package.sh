#!/bin/bash

# Create Local Deployment Package Script
# This script creates a deployment package for clients who want local hosting

CLIENT_NAME=${1:-"client"}
PACKAGE_NAME="cbt-${CLIENT_NAME}-local"

echo "📦 Creating local deployment package for ${CLIENT_NAME}..."

# Create package directory
mkdir -p ${PACKAGE_NAME}

# Copy frontend files
echo "📁 Copying frontend files..."
cp -r frontend ${PACKAGE_NAME}/

# Copy deployment files
echo "📄 Copying deployment files..."
cp docker-compose.yml ${PACKAGE_NAME}/
cp DEPLOYMENT.md ${PACKAGE_NAME}/
cp README.md ${PACKAGE_NAME}/

# Create client-specific docker-compose
echo "🔧 Creating client-specific docker-compose..."
cat > ${PACKAGE_NAME}/docker-compose.yml << EOF
version: '3.8'

services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - REACT_APP_CLIENT_NAME=${CLIENT_NAME}
    volumes:
      - ./logs:/var/log/nginx
    networks:
      - cbt-network

networks:
  cbt-network:
    driver: bridge
EOF

# Create deployment script
echo "🚀 Creating deployment script..."
cat > ${PACKAGE_NAME}/deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying CBT App..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose up -d

echo "✅ CBT App deployed successfully!"
echo "🌐 Access the application at: http://localhost"
echo "📝 Admin login: admin / admin123"
echo ""
echo "📋 Management Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop app: docker-compose down"
echo "  Restart app: docker-compose restart"
echo "  Update app: docker-compose pull && docker-compose up -d"
EOF

# Make deployment script executable
chmod +x ${PACKAGE_NAME}/deploy.sh

# Create client instructions
echo "📖 Creating client instructions..."
cat > ${PACKAGE_NAME}/INSTALL.md << EOF
# CBT App Installation Guide

## Prerequisites
- Docker installed
- Docker Compose installed
- Port 80 available

## Quick Installation

1. **Extract the package:**
   \`\`\`bash
   tar -xzf ${PACKAGE_NAME}.tar.gz
   cd ${PACKAGE_NAME}
   \`\`\`

2. **Deploy the application:**
   \`\`\`bash
   ./deploy.sh
   \`\`\`

3. **Access the application:**
   - Open browser to: http://localhost
   - Admin login: admin / admin123

## Management Commands

- **View logs:** \`docker-compose logs -f\`
- **Stop app:** \`docker-compose down\`
- **Restart app:** \`docker-compose restart\`
- **Update app:** \`docker-compose pull && docker-compose up -d\`

## Data Storage
- All data is stored in the browser (localStorage)
- No database required
- Data persists until browser is cleared

## Support
For technical support, contact your system administrator.
EOF

# Create package archive
echo "📦 Creating package archive..."
tar -czf ${PACKAGE_NAME}.tar.gz ${PACKAGE_NAME}/

# Clean up temporary directory
rm -rf ${PACKAGE_NAME}

echo "✅ Package created successfully!"
echo "📦 Package file: ${PACKAGE_NAME}.tar.gz"
echo ""
echo "📋 Delivery Instructions:"
echo "1. Send ${PACKAGE_NAME}.tar.gz to the client"
echo "2. Client should extract and run ./deploy.sh"
echo "3. Application will be available at http://localhost" 