# Client Deployment Guide

This guide shows how to deploy the CBT app to different clients with different hosting requirements.

## 🎯 **Deployment Scenarios**

### **Scenario 1: Local Server Client (Frontend-Only)**
**Client Type:** Wants to host on their own server
**Data Storage:** localStorage (browser-based)
**Best For:** Single admin, simple setup

### **Scenario 2: Cloud Hosting Client (Full-Stack)**
**Client Type:** Wants cloud hosting with backend
**Data Storage:** MongoDB database
**Best For:** Multiple admins, centralized data

## 🖥️ **Local Server Deployment (Client A)**

### **Option 1: Docker Deployment (Recommended)**

**Step 1: Prepare the deployment package**
```bash
# Create deployment package for client
mkdir cbt-local-deployment
cp -r frontend cbt-local-deployment/
cp docker-compose.yml cbt-local-deployment/
cp deploy-frontend-only.sh cbt-local-deployment/
cp DEPLOYMENT.md cbt-local-deployment/
cp README.md cbt-local-deployment/
```

**Step 2: Create client-specific docker-compose**
```yaml
# cbt-local-deployment/docker-compose.yml
version: '3.8'

services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"  # Use port 80 for production
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - REACT_APP_CLIENT_NAME=Client A
    volumes:
      - ./logs:/var/log/nginx
    networks:
      - cbt-network

networks:
  cbt-network:
    driver: bridge
```

**Step 3: Create deployment script for client**
```bash
#!/bin/bash
# cbt-local-deployment/deploy.sh

echo "🚀 Deploying CBT App for Client A..."

# Build and start the application
docker-compose up -d

echo "✅ CBT App deployed successfully!"
echo "🌐 Access the application at: http://localhost"
echo "📝 Admin login: admin / admin123"
echo ""
echo "📋 Management Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop app: docker-compose down"
echo "  Restart app: docker-compose restart"
```

**Step 4: Package and deliver to client**
```bash
# Create deployment package
tar -czf cbt-client-a-local.tar.gz cbt-local-deployment/

# Deliver to client with instructions:
# 1. Extract the package
# 2. Run: chmod +x deploy.sh
# 3. Run: ./deploy.sh
```

### **Option 2: Simple Local Server**

**Step 1: Create client package**
```bash
mkdir cbt-client-a-simple
cp -r frontend cbt-client-a-simple/
cp start-local-server.sh cbt-client-a-simple/
cp start-local-server.bat cbt-client-a-simple/
```

**Step 2: Create client instructions**
```bash
# cbt-client-a-simple/INSTALL.md
# CBT App Installation for Client A

## Prerequisites:
- Node.js 18+ installed
- npm installed

## Installation:
1. Open terminal/command prompt
2. Navigate to this folder
3. Run: ./start-local-server.sh (Linux/Mac)
   or: start-local-server.bat (Windows)

## Access:
- Application: http://localhost:3000
- Admin login: admin / admin123

## Data Storage:
- All data is stored in the browser
- No database required
- Data persists until browser is cleared
```

## ☁️ **Cloud Hosting Deployment (Client B)**

### **Frontend Deployment (Netlify/Vercel)**

**Step 1: Create client-specific branch**
```bash
# Create branch for client B
git checkout -b client-b-cloud

# Update frontend configuration
cd frontend
# Update package.json with client-specific settings
```

**Step 2: Configure frontend for backend**
```javascript
// frontend/src/config.js
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  clientName: process.env.REACT_APP_CLIENT_NAME || 'Client B',
  environment: process.env.REACT_APP_ENVIRONMENT || 'production'
};

export default config;
```

**Step 3: Deploy frontend to cloud**
```bash
# Deploy to Netlify
git push origin client-b-cloud

# Or deploy to Vercel
vercel --prod
```

### **Backend Deployment (Vercel/Railway/Render)**

**Step 1: Prepare backend for cloud deployment**
```bash
# Create backend deployment package
mkdir cbt-backend-cloud
cp -r backend cbt-backend-cloud/
cp vercel.json cbt-backend-cloud/
```

**Step 2: Configure backend for cloud**
```javascript
// backend/src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**Step 3: Deploy backend to cloud service**

**Option A: Vercel (Serverless Functions)**
```bash
# Deploy to Vercel
cd cbt-backend-cloud
vercel --prod
```

**Option B: Railway**
```bash
# Connect to Railway
railway login
railway init
railway up
```

**Option C: Render**
```bash
# Connect to Render
# Use Render dashboard to connect GitHub repository
```

## 🔧 **Client-Specific Configuration**

### **Environment Variables**

**Client A (Local - Frontend Only):**
```env
# No environment variables needed
# Uses localStorage for data storage
```

**Client B (Cloud - Full Stack):**
```env
# Frontend (.env)
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_CLIENT_NAME=Client B
REACT_APP_ENVIRONMENT=production

# Backend (.env)
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cbt
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-frontend-url.com
```

## 📋 **Deployment Checklist**

### **For Local Server Client (Client A):**
- [ ] Create deployment package
- [ ] Test Docker deployment locally
- [ ] Create client instructions
- [ ] Package and deliver
- [ ] Provide support documentation

### **For Cloud Hosting Client (Client B):**
- [ ] Set up cloud accounts (Netlify, Vercel, etc.)
- [ ] Configure environment variables
- [ ] Deploy frontend to cloud
- [ ] Deploy backend to cloud
- [ ] Set up database (MongoDB Atlas)
- [ ] Test full-stack deployment
- [ ] Provide access credentials

## 🚀 **Quick Deployment Commands**

### **Client A - Local Server:**
```bash
# Create deployment package
./create-local-package.sh client-a

# Deploy locally
cd cbt-client-a-local
./deploy.sh
```

### **Client B - Cloud Hosting:**
```bash
# Deploy frontend
git push origin client-b-cloud

# Deploy backend
cd backend
vercel --prod
```

## 📞 **Client Support**

### **Client A Support:**
- **Installation:** Docker-based deployment
- **Maintenance:** Simple restart commands
- **Data Backup:** Browser localStorage export
- **Updates:** Manual deployment package updates

### **Client B Support:**
- **Installation:** Cloud-based deployment
- **Maintenance:** Automatic updates via Git
- **Data Backup:** MongoDB Atlas backup
- **Updates:** Git push deployment

## 🎯 **Benefits of This Approach**

### **For You (Developer):**
- ✅ **Single codebase** for all clients
- ✅ **Flexible deployment** strategies
- ✅ **Easy maintenance** and updates
- ✅ **Scalable business** model

### **For Clients:**
- ✅ **Client A:** Simple, self-contained deployment
- ✅ **Client B:** Professional cloud hosting
- ✅ **Both:** Same features, different infrastructure
- ✅ **Both:** Reliable and secure

This setup allows you to serve different client needs while maintaining a single, professional codebase! 