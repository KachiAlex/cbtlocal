# CBT App Deployment Guide

This guide covers both cloud hosting and local server deployment options.

## 🌐 Cloud Hosting

### Option 1: Netlify (Recommended)

#### Prerequisites:
- Netlify account
- Git repository connected to Netlify

#### Steps:
1. **Connect Repository:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Node version: `18`

3. **Environment Variables (Optional):**
   - `REACT_APP_ENVIRONMENT`: `production`

4. **Custom Domain:**
   - Go to Site settings > Domain management
   - Add your custom domain

#### Deployment Commands:
```bash
# Deploy to Netlify
git push origin main  # Auto-deploys if connected
```

### Option 2: Vercel

#### Prerequisites:
- Vercel account
- Vercel CLI installed

#### Steps:
1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project or create new
   - Set build settings
   - Deploy

## 🖥️ Local Server Hosting

### Option 1: Docker (Recommended for Production)

#### Prerequisites:
- Docker installed
- Docker Compose installed

#### Steps:
1. **Build and Run:**
   ```bash
   # Build and start the container
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop the server
   docker-compose down
   ```

2. **Access the app:**
   - Open browser to `http://localhost`

#### Manual Docker Commands:
```bash
# Build the image
docker build -t cbt-app .

# Run the container
docker run -p 80:80 cbt-app
```

### Option 2: Simple Local Server

#### Prerequisites:
- Node.js 18+ installed
- npm installed

#### Steps:

**Linux/Mac:**
```bash
# Make script executable
chmod +x start-local-server.sh

# Run the script
./start-local-server.sh
```

**Windows:**
```cmd
# Run the batch file
start-local-server.bat
```

**Manual Steps:**
```bash
# Install dependencies
npm install

# Build the app
npm run build

# Install serve globally
npm install -g serve

# Start server
serve -s build -l 3000
```

### Option 3: Nginx (Advanced)

#### Prerequisites:
- Nginx installed
- Node.js for building

#### Steps:
1. **Build the app:**
   ```bash
   npm install
   npm run build
   ```

2. **Copy to nginx directory:**
   ```bash
   sudo cp -r build/* /var/www/html/
   ```

3. **Configure nginx:**
   ```bash
   sudo cp nginx.conf /etc/nginx/nginx.conf
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for environment-specific settings:

```env
REACT_APP_ENVIRONMENT=production
REACT_APP_API_URL=https://your-api.com
REACT_APP_CLIENT_NAME=Client Name
```

### Client-Specific Customization

For different clients, you can:

1. **Use different branches:**
   ```bash
   git checkout client-a
   # Deploy client A version
   
   git checkout client-b
   # Deploy client B version
   ```

2. **Use environment variables:**
   ```env
   REACT_APP_CLIENT_NAME=Client A
   REACT_APP_THEME_COLOR=#ff0000
   ```

3. **Use different domains:**
   - Client A: `cbt-client-a.netlify.app`
   - Client B: `cbt-client-b.vercel.app`
   - Client C: `localhost` (local server)

## 📊 Monitoring & Maintenance

### Health Checks
- Cloud: Built-in monitoring
- Local: `http://localhost/health`

### Logs
- Cloud: Platform-specific logging
- Local: `./logs/` directory (Docker) or console output

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
npm run build

# Restart server (if using Docker)
docker-compose restart
```

## 🔒 Security Considerations

### Local Server:
- Firewall configuration
- SSL certificates (for production)
- Regular security updates

### Cloud Hosting:
- HTTPS enabled by default
- DDoS protection
- Automatic security updates

## 📞 Support

For deployment issues:
1. Check the logs
2. Verify prerequisites
3. Test locally first
4. Contact support with error details 