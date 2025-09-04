#!/bin/bash

# Create Cloud Deployment Package Script
# This script creates a deployment package for clients who want cloud hosting

CLIENT_NAME=${1:-"client"}
PACKAGE_NAME="cbt-${CLIENT_NAME}-cloud"

echo "☁️ Creating cloud deployment package for ${CLIENT_NAME}..."

# Create package directory
mkdir -p ${PACKAGE_NAME}

# Copy frontend files
echo "📁 Copying frontend files..."
cp -r frontend ${PACKAGE_NAME}/

# Copy backend files
echo "🔧 Copying backend files..."
cp -r backend ${PACKAGE_NAME}/

# Copy deployment configuration
echo "📄 Copying deployment configuration..."
cp netlify.toml ${PACKAGE_NAME}/
cp vercel.json ${PACKAGE_NAME}/
cp docker-compose.yml ${PACKAGE_NAME}/

# Create client-specific configuration
echo "⚙️ Creating client-specific configuration..."

# Frontend environment variables
cat > ${PACKAGE_NAME}/frontend/.env.example << EOF
# Frontend Environment Variables for ${CLIENT_NAME}
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_CLIENT_NAME=${CLIENT_NAME}
REACT_APP_ENVIRONMENT=production
EOF

# Backend environment variables
cat > ${PACKAGE_NAME}/backend/.env.example << EOF
# Backend Environment Variables for ${CLIENT_NAME}

# Database Configuration
DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cbt?retryWrites=true&w=majority

# Alternative: Supabase Configuration
# DB_TYPE=supabase
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=https://your-frontend-url.com
EOF

# Create deployment guide
echo "📖 Creating deployment guide..."
cat > ${PACKAGE_NAME}/CLOUD-DEPLOYMENT.md << EOF
# Cloud Deployment Guide for ${CLIENT_NAME}

This guide shows how to deploy the CBT app to cloud hosting with backend support.

## 🎯 Deployment Architecture

- **Frontend:** Netlify/Vercel (React App)
- **Backend:** Vercel/Railway/Render (Express API)
- **Database:** MongoDB Atlas
- **Data Storage:** Centralized database

## 🚀 Backend Hosting Options

### Option 1: Render (Recommended)
- ✅ Free tier available (750 hours/month)
- ✅ Easy deployment from Git
- ✅ Traditional server hosting
- ✅ Automatic HTTPS

### Option 2: Vercel
- ✅ Free tier available
- ✅ Serverless functions
- ✅ Automatic scaling

### Option 3: Railway
- ✅ Free tier available
- ✅ Simple deployment
- ✅ Good for full-stack apps

## 🚀 Quick Deployment

### Step 1: Deploy Frontend (Netlify)

1. **Connect to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build command: \`cd frontend && npm install && npm run build\`
   - Set publish directory: \`frontend/build\`

2. **Configure Environment Variables:**
   - Go to Site settings > Environment variables
   - Add: \`REACT_APP_API_URL\` = \`https://your-backend-url.com/api\`
   - Add: \`REACT_APP_CLIENT_NAME\` = \`${CLIENT_NAME}\`

3. **Deploy:**
   \`\`\`bash
   git push origin main
   \`\`\`

### Step 2: Deploy Backend (Vercel)

1. **Install Vercel CLI:**
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. **Deploy Backend:**
   \`\`\`bash
   cd backend
   vercel --prod
   \`\`\`

3. **Configure Environment Variables:**
   - Go to Vercel dashboard
   - Add environment variables from \`.env.example\`

### Step 3: Set Up Database (MongoDB Atlas)

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://mongodb.com/atlas)
   - Create free cluster

2. **Get Connection String:**
   - Copy connection string
   - Update \`MONGODB_URI\` in backend environment variables

## 🔧 Configuration

### Frontend Configuration (\`frontend/src/config.js\`)
\`\`\`javascript
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  clientName: process.env.REACT_APP_CLIENT_NAME || '${CLIENT_NAME}',
  environment: process.env.REACT_APP_ENVIRONMENT || 'production'
};

export default config;
\`\`\`

### Backend Configuration (\`backend/src/config/database.js\`)
\`\`\`javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;
\`\`\`

## 📊 Access Points

- **Frontend:** https://your-app.netlify.app
- **Backend API:** https://your-api.vercel.app
- **Health Check:** https://your-api.vercel.app/health
- **Admin Login:** admin / admin123

## 🔒 Security

- ✅ HTTPS enabled by default
- ✅ Environment variables for secrets
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation

## 📈 Scaling

- **Frontend:** Automatic scaling with CDN
- **Backend:** Serverless functions scale automatically
- **Database:** MongoDB Atlas handles scaling

## 🛠️ Maintenance

### Updates
\`\`\`bash
# Update frontend
git push origin main  # Auto-deploys to Netlify

# Update backend
cd backend
vercel --prod
\`\`\`

### Monitoring
- **Netlify:** Built-in analytics and monitoring
- **Vercel:** Function logs and performance metrics
- **MongoDB Atlas:** Database monitoring and alerts

## 📞 Support

For technical support:
1. Check deployment logs
2. Verify environment variables
3. Test API endpoints
4. Contact system administrator

## 🎯 Benefits

- ✅ **Professional hosting** with automatic scaling
- ✅ **Centralized data** storage
- ✅ **Multi-user support** with authentication
- ✅ **Automatic backups** and monitoring
- ✅ **Global CDN** for fast access
EOF

# Create deployment scripts
echo "🚀 Creating deployment scripts..."

# Frontend deployment script
cat > ${PACKAGE_NAME}/deploy-frontend.sh << 'EOF'
#!/bin/bash

echo "🌐 Deploying Frontend to Netlify..."

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Frontend built successfully!"
echo "📤 Push to git repository to deploy to Netlify:"
echo "   git add ."
echo "   git commit -m 'Deploy frontend'"
echo "   git push origin main"
EOF

# Backend deployment script
cat > ${PACKAGE_NAME}/deploy-backend.sh << 'EOF'
#!/bin/bash

echo "🔧 Deploying Backend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy backend
echo "🚀 Deploying backend..."
cd backend
vercel --prod

echo "✅ Backend deployed successfully!"
echo "🔗 Backend URL: Check Vercel dashboard for the URL"
EOF

# Make scripts executable
chmod +x ${PACKAGE_NAME}/deploy-frontend.sh
chmod +x ${PACKAGE_NAME}/deploy-backend.sh

# Create package archive
echo "📦 Creating package archive..."
tar -czf ${PACKAGE_NAME}.tar.gz ${PACKAGE_NAME}/

# Clean up temporary directory
rm -rf ${PACKAGE_NAME}

echo "✅ Cloud package created successfully!"
echo "📦 Package file: ${PACKAGE_NAME}.tar.gz"
echo ""
echo "📋 Delivery Instructions:"
echo "1. Send ${PACKAGE_NAME}.tar.gz to the client"
echo "2. Client should follow CLOUD-DEPLOYMENT.md"
echo "3. Set up cloud accounts (Netlify, Vercel, MongoDB Atlas)"
echo "4. Configure environment variables"
echo "5. Deploy frontend and backend" 