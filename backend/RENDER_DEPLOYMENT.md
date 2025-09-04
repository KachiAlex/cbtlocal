# Deploying CBT Backend to Render

This guide will help you deploy your CBT backend to Render, which is often simpler than Vercel for Node.js applications.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)

## Step 1: Prepare Your Repository

Your repository is already configured with:
- ✅ `render.yaml` - Render configuration file
- ✅ `package.json` - Proper start script
- ✅ `src/server.js` - Main application file

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Blueprint"**
3. **Connect your GitHub repository**
4. **Select your CBT backend repository**
5. **Render will automatically detect the `render.yaml` file**
6. **Click "Apply" to deploy**

### Option B: Manual Setup

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `cbt-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

## Step 3: Environment Variables

After deployment, go to your service settings and add these environment variables:

### Required Variables:
- `NODE_ENV` = `production`
- `JWT_SECRET` = [Generate a strong secret]
- `PORT` = `10000` (Render will override this automatically)

### Optional Variables (if you add database later):
- `MONGODB_URI` = Your MongoDB connection string
- `DB_TYPE` = `mongodb`

## Step 4: Generate JWT Secret

You can generate a strong JWT secret using:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use an online generator like:
- https://generate-secret.vercel.app/64

## Step 5: Test Your Deployment

Once deployed, your API will be available at:
`https://your-service-name.onrender.com`

Test endpoints:
- Health check: `https://your-service-name.onrender.com/health`
- API info: `https://your-service-name.onrender.com/api`

## Advantages of Render over Vercel

✅ **Simpler configuration** - No complex routing needed
✅ **Better for Node.js APIs** - Designed for backend services
✅ **Free tier available** - No credit card required
✅ **Automatic HTTPS** - SSL certificates included
✅ **Custom domains** - Easy to set up
✅ **Environment variables** - Simple UI for management

## Troubleshooting

### Common Issues:

1. **Build fails**: Check that all dependencies are in `package.json`
2. **Port issues**: Render automatically sets PORT environment variable
3. **Environment variables**: Make sure JWT_SECRET is set
4. **Timeout**: Free tier has 15-minute timeout for inactivity

### Useful Commands:

```bash
# Test locally
npm start

# Check logs in Render dashboard
# Go to your service → Logs tab
```

## Next Steps

After successful deployment:

1. **Update your frontend** to use the new Render URL
2. **Set up your database** (MongoDB Atlas recommended)
3. **Configure CORS** if needed
4. **Add authentication routes** using the JWT configuration

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)

Your backend should deploy much more smoothly on Render! 🚀 

## ✅ Complete Setup for Netlify + Render:

### 1. **Updated `netlify.toml`**
- Configured to build from the `frontend` directory
- Added environment variables for your Render backend URL
- Set up proper build commands

### 2. **Created API Configuration** (`frontend/src/config/api.js`)
- Manages backend URLs from environment variables
- Provides helper functions for API requests
- Handles authentication headers

### 3. **Created API Services** (`frontend/src/services/apiService.js`)
- Complete service layer for all your backend endpoints
- Ready for authentication, exams, questions, results, and users
- Proper error handling and request formatting

### 4. **Created Test Component** (`frontend/src/components/ApiTest.js`)
- Tests the connection to your Render backend
- Shows health status and API information
- Helps debug connection issues

### 5. **Created Setup Guide** (`NETLIFY_RENDER_SETUP.md`)
- Complete step-by-step instructions
- Troubleshooting guide
- Environment variable configuration

##  Next Steps:

### 1. **Update the API URL**
Replace `your-render-backend-name` in `netlify.toml` with your actual Render service name:
```toml
<code_block_to_apply_changes_from>
```

### 2. **Deploy Your Backend**
- Make sure your Render backend is deployed and working
- Get the actual URL from your Render dashboard

### 3. **Deploy Your Frontend**
- Push these changes to GitHub
- Netlify will automatically deploy using the `netlify.toml` configuration

### 4. **Test the Connection**
- Add the `ApiTest` component to your app temporarily
- Check if the connection works
- Remove the test component once confirmed

## 🔧 Key Features:

✅ **Environment-based configuration** - Different URLs for development/production
✅ **Complete API service layer** - Ready for all your backend endpoints
✅ **Authentication support** - JWT token handling
✅ **Error handling** - Proper error management
✅ **CORS ready** - Configured for cross-origin requests
✅ **Test component** - Easy connection testing

Your Netlify frontend is now fully configured to communicate with your Render backend! 🚀

Your Netlify frontend is now fully configured to communicate with your Render backend! 🚀 

## Netlify Build Settings

### Option 1: Using netlify.toml (Recommended - Already Configured)

Your `netlify.toml` file is already set up correctly:

```toml
<code_block_to_apply_changes_from>
```

### Option 2: Manual Netlify Dashboard Settings

If you prefer to set these manually in the Netlify dashboard:

| Setting | Value | Description |
|---------|-------|-------------|
| **Base directory** | `frontend` | Where your React app is located |
| **Build command** | `npm run build` | Command to build your React app |
| **Publish directory** | `build` | Where the built files are output |
| **Node version** | `18` | Node.js version to use |

## Detailed Settings Explanation

### 1. **Base Directory**: `frontend`
- This tells Netlify where your React application is located
- Since your React app is in the `frontend/` folder, this is correct

### 2. **Build Command**: `npm run build`
- This runs the build script in your `frontend/package.json`
- Creates the production build in the `build/` folder

### 3. **Publish Directory**: `build`
- This is where your built React app files are located
- Netlify will serve files from this directory

### 4. **Node Version**: `18`
- Matches your backend Node version
- Ensures compatibility

## Environment Variables

You also need to set these environment variables in Netlify:

### Required Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `https://your-render-backend-name.onrender.com` | Your Render backend URL |
| `REACT_APP_ENVIRONMENT` | `production` | Environment name |

### How to Set Environment Variables

#### Option A: In netlify.toml (Already Done)
```toml
[context.production.environment]
  REACT_APP_API_URL = "https://your-render-backend-name.onrender.com"
  REACT_APP_ENVIRONMENT = "production"
```

#### Option B: In Netlify Dashboard
1. Go to **Site settings** → **Environment variables**
2. Add each variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-actual-render-backend-name.onrender.com`
   - **Scopes**: Production, Deploy previews

## Complete Setup Steps

### 1. **Update Your Render Backend URL**
Replace the placeholder in your `netlify.toml`:

```toml
[context.production.environment]
  REACT_APP_API_URL = "https://your-actual-render-backend-name.onrender.com"
```

### 2. **Deploy to Netlify**

#### Option A: Automatic (Recommended)
1. Push your changes to GitHub
2. Connect your repository to Netlify
3. Netlify will automatically detect the `netlify.toml` file
4. It will use all the settings automatically

#### Option B: Manual Setup
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"New site from Git"**
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Add environment variables in the dashboard

## Verification

After deployment, you can verify the settings are correct by:

1. **Check the build logs** in Netlify dashboard
2. **Test the API connection** using the ApiTest component
3. **Check environment variables** in the browser console:
   ```javascript
   console.log('API URL:', process.env.REACT_APP_API_URL);
   ```

## Troubleshooting

### Common Issues:

1. **Build fails with "command not found"**
   - Make sure you're in the `frontend` directory
   - Check that `package.json` exists in the frontend folder

2. **Build fails with missing dependencies**
   - Make sure all dependencies are in `frontend/package.json`
   - Check that `npm install` runs successfully

3. **Environment variables not working**
   - Make sure they start with `REACT_APP_`
   - Rebuild the site after adding variables

4. **API connection fails**
   - Check that your Render backend URL is correct
   - Verify your backend is running

Your current `netlify.toml` configuration should work perfectly! Just update the API URL with your actual Render backend URL. 🎯 