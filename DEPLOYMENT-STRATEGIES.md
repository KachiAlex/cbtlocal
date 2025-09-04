# CBT App Deployment Strategies

This guide shows how to use the same Git repository for different deployment scenarios.

## 🏗️ Repository Structure

```
CBT/
├── frontend/              # React application
│   ├── src/              # React source code
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies
│   └── Dockerfile        # Frontend container
├── backend/              # Express.js API (optional)
│   ├── src/              # Backend source code
│   ├── package.json      # Backend dependencies
│   └── Dockerfile        # Backend container
├── package.json          # Root package.json
├── docker-compose.yml    # Multi-service deployment
├── deploy-frontend-only.sh  # Frontend-only deployment
├── deploy-fullstack.sh   # Full-stack deployment
└── README.md
```

## 🎯 Deployment Scenarios

### **Scenario 1: Frontend-Only (Current Setup)**
**Use Case:** Single admin, localStorage data storage
**Best For:** Simple deployments, local hosting

#### **Deployment Options:**

**A. Cloud Hosting (Netlify/Vercel):**
```bash
# Deploy frontend to cloud
git push origin main  # Auto-deploys to Netlify
```

**B. Local Server:**
```bash
# Deploy to local server
./deploy-frontend-only.sh docker
# or
./deploy-frontend-only.sh local
```

**C. Docker (Frontend Only):**
```bash
# Deploy only frontend service
docker-compose up frontend -d
```

### **Scenario 2: Full-Stack (Future Setup)**
**Use Case:** Multiple admins, centralized data, real-time collaboration
**Best For:** Production deployments, multi-user environments

#### **Deployment Options:**

**A. Local Full-Stack:**
```bash
# Deploy complete stack locally
./deploy-fullstack.sh docker
```

**B. Production Full-Stack:**
```bash
# Deploy with nginx reverse proxy
./deploy-fullstack.sh prod
```

**C. Development Environment:**
```bash
# Start development servers
./deploy-fullstack.sh dev
```

## 🚀 Quick Start Commands

### **For Frontend-Only Deployment:**

```bash
# 1. Cloud deployment (Netlify)
git push origin main

# 2. Local Docker deployment
docker-compose up frontend -d

# 3. Local server deployment
cd frontend && npm install && npm run build && npx serve -s build -l 3000
```

### **For Full-Stack Deployment:**

```bash
# 1. Install all dependencies
npm run install:all

# 2. Build everything
npm run build

# 3. Deploy with Docker
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MongoDB: localhost:27017
```

## 🔧 Configuration Management

### **Environment Variables:**

**Frontend (.env in frontend/):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=production
REACT_APP_CLIENT_NAME=Client Name
```

**Backend (.env in backend/):**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cbt
JWT_SECRET=your-secret-key
```

### **Client-Specific Configurations:**

**Option 1: Different Branches**
```bash
# Client A (Frontend-only)
git checkout client-a-frontend
./deploy-frontend-only.sh cloud

# Client B (Full-stack)
git checkout client-b-fullstack
./deploy-fullstack.sh docker
```

**Option 2: Environment Variables**
```bash
# Client A
REACT_APP_CLIENT_NAME="Client A" ./deploy-frontend-only.sh cloud

# Client B
REACT_APP_CLIENT_NAME="Client B" ./deploy-fullstack.sh docker
```

## 📊 Service Architecture

### **Frontend-Only Architecture:**
```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
│                 │
│  localStorage   │
│  Data Storage   │
└─────────────────┘
```

### **Full-Stack Architecture:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Express API    │    │   MongoDB       │
│  (Frontend)     │◄──►│   (Backend)     │◄──►│  (Database)     │
│                 │    │                 │    │                 │
│  UI/UX          │    │  Business Logic │    │  Data Storage   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Migration Paths

### **From Frontend-Only to Full-Stack:**

1. **Keep existing frontend** - No changes needed initially
2. **Add backend** - Implement API endpoints
3. **Update frontend** - Replace localStorage with API calls
4. **Deploy full-stack** - Use docker-compose

### **From Full-Stack to Frontend-Only:**

1. **Extract frontend** - Use only frontend service
2. **Disable backend** - Comment out in docker-compose
3. **Update frontend** - Switch back to localStorage
4. **Deploy frontend-only** - Use frontend-only scripts

## 🛠️ Development Workflow

### **Frontend Development:**
```bash
cd frontend
npm start
# Access at http://localhost:3000
```

### **Backend Development:**
```bash
cd backend
npm run dev
# API at http://localhost:5000
```

### **Full-Stack Development:**
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## 📈 Scaling Strategies

### **Frontend-Only Scaling:**
- **Horizontal:** Multiple static hosting instances
- **CDN:** Global content delivery
- **Caching:** Browser and CDN caching

### **Full-Stack Scaling:**
- **Load Balancer:** Distribute traffic
- **Database Clustering:** MongoDB replica sets
- **Microservices:** Split backend services
- **Container Orchestration:** Kubernetes

## 🔒 Security Considerations

### **Frontend-Only:**
- ✅ HTTPS (automatic with cloud hosting)
- ✅ Content Security Policy
- ⚠️ Data stored in browser (limited security)

### **Full-Stack:**
- ✅ HTTPS with SSL certificates
- ✅ API authentication (JWT)
- ✅ Database security
- ✅ Rate limiting
- ✅ Input validation

## 📞 Support & Troubleshooting

### **Common Issues:**

**Frontend-Only:**
- Data not persisting across devices
- No multi-user support
- Limited data backup

**Full-Stack:**
- Database connection issues
- API authentication problems
- Deployment complexity

### **Debugging Commands:**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Health checks
curl http://localhost:3000
curl http://localhost:5000/health
```

## 🎯 Recommendation

### **Start With Frontend-Only:**
- ✅ **Faster deployment**
- ✅ **Simpler maintenance**
- ✅ **Lower costs**
- ✅ **Perfect for single admin**

### **Upgrade to Full-Stack When:**
- Multiple admins need to collaborate
- Centralized data management required
- Advanced analytics needed
- Data backup/restore required

This flexible structure allows you to serve different clients with different needs using the same codebase! 