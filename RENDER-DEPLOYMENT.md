# Render Backend Deployment Guide

This guide shows how to deploy the CBT backend to Render.

## 🎯 **Why Render?**

- ✅ **Free tier** available (750 hours/month)
- ✅ **Easy deployment** from Git
- ✅ **Automatic HTTPS** and custom domains
- ✅ **Good for** Node.js/Express apps
- ✅ **Traditional server** hosting (not serverless)

## 🚀 **Quick Setup**

### **Step 1: Create Render Account**
```bash
# Go to https://render.com
# Click "Get Started"
# Sign up with GitHub
```

### **Step 2: Create New Web Service**
```bash
# In Render Dashboard:
# 1. Click "New +"
# 2. Select "Web Service"
# 3. Connect your GitHub repository
# 4. Select the CBT repository
```

### **Step 3: Configure the Service**
```bash
# Service Configuration:
Name: cbt-backend
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

### **Step 4: Set Environment Variables**
```bash
# Add these environment variables in Render:

# Database Configuration
DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cbt?retryWrites=true&w=majority

# Server Configuration
NODE_ENV=production
PORT=10000
JWT_SECRET=your-secret-key-here

# CORS Configuration
CORS_ORIGIN=https://your-frontend-url.com
```

### **Step 5: Deploy**
```bash
# Click "Create Web Service"
# Render will automatically deploy your backend
# Wait for deployment to complete
```

## 📁 **Repository Structure for Render**

Your repository should look like this:
```
CBT/
├── frontend/          # React app (deploy to Netlify)
├── backend/           # Express API (deploy to Render)
│   ├── src/
│   ├── package.json
│   └── ...
├── package.json       # Root package.json
└── ...
```

## 🔧 **Backend Configuration**

### **Update backend/package.json:**
```json
{
  "name": "cbt-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "build": "echo 'Backend build completed'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-rate-limit": "^6.10.0",
    "express-validator": "^7.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### **Update backend/src/server.js:**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DB_TYPE || 'mongodb'
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'CBT Backend API is running on Render',
    version: '1.0.0',
    database: process.env.DB_TYPE || 'mongodb',
    endpoints: {
      health: '/health',
      exams: '/api/exams',
      questions: '/api/questions',
      results: '/api/results',
      users: '/api/users'
    }
  });
});

// Placeholder routes for future implementation
app.get('/api/exams', (req, res) => {
  res.json({ message: 'Exams endpoint - to be implemented' });
});

app.get('/api/questions', (req, res) => {
  res.json({ message: 'Questions endpoint - to be implemented' });
});

app.get('/api/results', (req, res) => {
  res.json({ message: 'Results endpoint - to be implemented' });
});

app.get('/api/users', (req, res) => {
  res.json({ message: 'Users endpoint - to be implemented' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 CBT Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
  console.log(`🗄️ Database: ${process.env.DB_TYPE || 'mongodb'}`);
});

module.exports = app;
```

## 🌐 **Frontend Configuration**

### **Update frontend environment variables:**
```env
# frontend/.env
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
REACT_APP_CLIENT_NAME=Client B
REACT_APP_ENVIRONMENT=production
```

## 📊 **Deployment Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Express API    │    │   MongoDB       │
│  (Netlify)      │◄──►│   (Render)      │◄──►│  (Atlas)        │
│                 │    │                 │    │                 │
│  Frontend       │    │  Backend        │    │  Database       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔒 **Security Configuration**

### **CORS Settings:**
```javascript
// In backend/src/server.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### **Environment Variables:**
```env
# Required for Render
NODE_ENV=production
PORT=10000  # Render uses port 10000 for free tier
DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cbt?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=https://your-frontend-url.com
```

## 🚀 **Deployment Steps**

### **1. Prepare Repository:**
```bash
# Ensure backend/package.json has correct scripts
# Ensure backend/src/server.js is properly configured
# Commit and push changes
git add .
git commit -m "Configure backend for Render deployment"
git push origin main
```

### **2. Deploy to Render:**
```bash
# Follow the setup steps above
# Render will automatically deploy from your Git repository
```

### **3. Test Deployment:**
```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/health

# Test API endpoint
curl https://your-backend-url.onrender.com/api
```

### **4. Update Frontend:**
```bash
# Update frontend environment variables
# Deploy frontend to Netlify
git push origin main
```

## 📈 **Monitoring and Logs**

### **View Logs in Render:**
```bash
# In Render Dashboard:
# 1. Go to your web service
# 2. Click "Logs" tab
# 3. View real-time logs
```

### **Health Monitoring:**
```bash
# Set up health checks
# Render will monitor your service automatically
# Get notified of any issues
```

## 💰 **Costs**

### **Free Tier:**
- ✅ **750 hours/month** (enough for 24/7 operation)
- ✅ **Automatic HTTPS**
- ✅ **Custom domains**
- ✅ **Git deployment**

### **Paid Plans:**
- **$7/month:** Dedicated instances
- **$25/month:** Professional features

## 🎯 **Benefits of Render**

### **For Development:**
- ✅ **Easy deployment** from Git
- ✅ **Automatic scaling**
- ✅ **Built-in monitoring**
- ✅ **Good documentation**

### **For Production:**
- ✅ **Reliable hosting**
- ✅ **Automatic HTTPS**
- ✅ **Custom domains**
- ✅ **Professional support**

## 🚀 **Next Steps**

1. **Choose Render** for backend hosting
2. **Set up MongoDB Atlas** for database
3. **Deploy backend** to Render
4. **Deploy frontend** to Netlify
5. **Test full-stack** deployment
6. **Monitor and maintain**

**Your CBT app will be running on professional cloud infrastructure!** 🎉 