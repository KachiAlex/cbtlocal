# CBT Hierarchical Admin System - Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying the CBT system with the new hierarchical admin management to both Netlify (frontend) and Render (backend).

## 📋 Prerequisites

- GitHub repository with the CBT project
- Netlify account (for frontend)
- Render account (for backend)
- MongoDB Atlas database
- Environment variables configured

## 🔧 Backend Deployment (Render)

### 1. Deploy to Render

1. **Connect GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Service**
   - **Name**: `cbt-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install --omit=dev`
   - **Start Command**: `npm start`

3. **Environment Variables**
   Set these in Render dashboard:
   ```
   NODE_ENV=production
   DB_TYPE=mongodb
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your backend

### 2. Verify Backend Deployment

1. **Check Health Endpoint**
   ```
   https://your-render-app.onrender.com/health
   ```

2. **Test Admin Endpoints**
   ```bash
   # Test default admin creation
   curl -X POST https://your-render-app.onrender.com/api/init-admin
   
   # Test authentication
   curl -X POST https://your-render-app.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

## 🌐 Frontend Deployment (Netlify)

### 1. Deploy to Netlify

1. **Connect GitHub Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm ci --audit-level=moderate && npm run build`
   - **Publish directory**: `build`

3. **Environment Variables**
   Set these in Netlify dashboard:
   ```
   REACT_APP_ENVIRONMENT=production
   REACT_APP_API_URL=https://your-render-app.onrender.com
   REACT_APP_USE_API=true
   ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your frontend

### 2. Configure Redirects

Netlify will automatically use the `netlify.toml` configuration:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔐 Initial Setup After Deployment

### 1. Create Default Admin

After both services are deployed:

1. **Access your frontend URL**
2. **Login with default credentials:**
   - Username: `admin`
   - Password: `admin123`

3. **Verify Admin Access**
   - Go to Settings tab
   - You should see "Default Administrator" status
   - Admin management features should be available

### 2. Test Admin Management

1. **Create New Admin**
   - Click "Create New Admin" in Settings
   - Fill in the form with test admin details
   - Verify the new admin is created

2. **Test Admin Login**
   - Logout and login with the new admin credentials
   - Verify limited access (no admin management features)

3. **Test Admin Deletion**
   - Login as default admin
   - Delete the test admin user
   - Verify deletion works

## 🔧 Environment Variables Reference

### Backend (Render)
```bash
NODE_ENV=production
DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cbt
JWT_SECRET=your_secure_jwt_secret_key
```

### Frontend (Netlify)
```bash
REACT_APP_ENVIRONMENT=production
REACT_APP_API_URL=https://your-render-app.onrender.com
REACT_APP_USE_API=true
```

## 🧪 Testing Deployment

### 1. Backend Tests
```bash
# Test health endpoint
curl https://your-render-app.onrender.com/health

# Test admin creation
curl -X POST https://your-render-app.onrender.com/api/init-admin

# Test authentication
curl -X POST https://your-render-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Frontend Tests
1. **Load the frontend URL**
2. **Test admin login**
3. **Test admin management features**
4. **Test creating/deleting admin users**

## 🔄 Continuous Deployment

### Automatic Deployments
- **Netlify**: Automatically deploys on push to main branch
- **Render**: Automatically deploys on push to main branch

### Manual Deployments
- **Netlify**: Trigger deploy from dashboard
- **Render**: Trigger deploy from dashboard

## 🚨 Troubleshooting

### Common Issues

1. **Backend Not Starting**
   - Check environment variables in Render
   - Verify MongoDB connection string
   - Check build logs in Render dashboard

2. **Frontend Build Fails**
   - Check environment variables in Netlify
   - Verify API URL is correct
   - Check build logs in Netlify dashboard

3. **Admin Login Not Working**
   - Verify backend is running
   - Check API URL in frontend environment
   - Test backend endpoints directly

4. **CORS Issues**
   - Backend should handle CORS automatically
   - Check if API URL is accessible from frontend

### Debug Steps

1. **Check Backend Logs**
   - Go to Render dashboard
   - View service logs
   - Look for error messages

2. **Check Frontend Logs**
   - Go to Netlify dashboard
   - View deploy logs
   - Check for build errors

3. **Test API Endpoints**
   - Use curl or Postman to test backend directly
   - Verify all endpoints are working

## 📊 Monitoring

### Backend Monitoring (Render)
- **Health Checks**: Automatic health monitoring
- **Logs**: Real-time log viewing
- **Metrics**: Performance monitoring

### Frontend Monitoring (Netlify)
- **Deploy Status**: Automatic deployment status
- **Build Logs**: Detailed build information
- **Analytics**: Optional site analytics

## 🔒 Security Considerations

### Production Security
1. **Use Strong JWT Secret**
2. **Secure MongoDB Connection**
3. **Enable HTTPS (automatic on Netlify/Render)**
4. **Regular Security Updates**

### Admin Security
1. **Change Default Admin Password**
2. **Use Strong Passwords for New Admins**
3. **Monitor Admin Activity**
4. **Regular Admin Account Review**

## 📝 Post-Deployment Checklist

- [ ] Backend health endpoint responds
- [ ] Frontend loads without errors
- [ ] Default admin can login
- [ ] Admin management features work
- [ ] New admin creation works
- [ ] Admin deletion works
- [ ] Regular admin access is limited
- [ ] All environment variables are set
- [ ] HTTPS is enabled
- [ ] Monitoring is configured

## 🆘 Support

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Review deployment logs**
3. **Test endpoints individually**
4. **Verify environment variables**
5. **Check the hierarchical admin documentation**

The system should be fully functional with the new admin hierarchy after deployment! 