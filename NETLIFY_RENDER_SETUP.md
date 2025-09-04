# Netlify + Render Setup Guide

This guide explains how to configure your Netlify frontend to connect with your Render backend.

## Prerequisites

1. **Render Backend**: Your backend should be deployed on Render
2. **Netlify Account**: You need a Netlify account
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Get Your Render Backend URL

After deploying your backend on Render, you'll get a URL like:
```
https://your-service-name.onrender.com
```

## Step 2: Update Netlify Configuration

### Option A: Using netlify.toml (Recommended)

Your `netlify.toml` file is already configured. Just update the API URL:

```toml
[context.production.environment]
  REACT_APP_ENVIRONMENT = "production"
  REACT_APP_API_URL = "https://your-actual-render-backend-name.onrender.com"

[context.deploy-preview.environment]
  REACT_APP_ENVIRONMENT = "preview"
  REACT_APP_API_URL = "https://your-actual-render-backend-name.onrender.com"
```

### Option B: Using Netlify Dashboard

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add these variables:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-actual-render-backend-name.onrender.com`
   - **Scopes**: Production, Deploy previews

## Step 3: Deploy to Netlify

### Option A: Using netlify.toml (Automatic)

1. Push your changes to GitHub
2. Netlify will automatically detect the `netlify.toml` file
3. It will build from the `frontend` directory
4. Environment variables will be set automatically

### Option B: Manual Setup

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"New site from Git"**
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Add environment variables in the dashboard

## Step 4: Test the Connection

### Using the ApiTest Component

1. Import and use the `ApiTest` component in your app:

```jsx
import ApiTest from './components/ApiTest';

// Add to your routes or main component
<ApiTest />
```

2. Deploy and check if the connection works

### Manual Testing

You can also test manually by visiting:
- `https://your-netlify-site.netlify.app/api-test` (if you add the route)
- Or check the browser console for API calls

## Step 5: Environment Variables

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Your Render backend URL | `https://cbt-backend.onrender.com` |
| `REACT_APP_ENVIRONMENT` | Environment name | `production` |

### Optional Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_DEBUG` | Enable debug mode | `true` |
| `REACT_APP_VERSION` | App version | `1.0.0` |

## Step 6: CORS Configuration

Your Render backend should already have CORS configured, but if you get CORS errors:

### Backend CORS Setup

In your `src/server.js`, make sure CORS is configured:

```javascript
app.use(cors({
  origin: [
    'https://your-netlify-site.netlify.app',
    'http://localhost:3000' // for local development
  ],
  credentials: true
}));
```

## Step 7: Using the API Services

### Basic Usage

```javascript
import { healthCheck, examService } from '../services/apiService';

// Test connection
const health = await healthCheck();

// Get exams (when implemented)
const exams = await examService.getAll(token);
```

### Authentication

```javascript
import { authService } from '../services/apiService';

// Login
const response = await authService.login({
  email: 'user@example.com',
  password: 'password'
});

// Store token
localStorage.setItem('token', response.token);
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check that your Render backend has CORS configured
   - Verify the origin URL in your backend CORS settings

2. **Environment Variables Not Working**
   - Make sure variables start with `REACT_APP_`
   - Rebuild your Netlify site after adding variables

3. **API Connection Fails**
   - Check your Render backend URL
   - Verify your backend is running
   - Check the browser console for errors

4. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Verify the build command in `netlify.toml`

### Debug Steps

1. **Check Environment Variables**
   ```javascript
   console.log('API URL:', process.env.REACT_APP_API_URL);
   ```

2. **Test API Endpoints**
   ```javascript
   fetch('https://your-backend.onrender.com/health')
     .then(res => res.json())
     .then(data => console.log(data));
   ```

3. **Check Network Tab**
   - Open browser dev tools
   - Go to Network tab
   - Look for failed API requests

## File Structure

```
CBT/
├── frontend/
│   ├── src/
│   │   ├── config/
│   │   │   └── api.js          # API configuration
│   │   ├── services/
│   │   │   └── apiService.js   # API services
│   │   └── components/
│   │       └── ApiTest.js      # Connection test
│   └── package.json
├── backend/
│   └── src/
│       └── server.js           # Your backend
└── netlify.toml               # Netlify configuration
```

## Next Steps

1. **Deploy your backend** to Render
2. **Update the API URL** in `netlify.toml`
3. **Deploy your frontend** to Netlify
4. **Test the connection** using the ApiTest component
5. **Implement your features** using the API services

Your Netlify frontend should now successfully connect to your Render backend! 🚀 