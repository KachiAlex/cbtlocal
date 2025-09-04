# CBT Application

A flexible Computer Based Testing application that supports both frontend-only and full-stack deployments.

## 🚀 Quick Start

### **Frontend-Only Deployment (Current Setup)**
```bash
# Deploy to cloud (Netlify/Vercel)
git push origin main

# Deploy locally with Docker
docker-compose up frontend -d

# Deploy with local server
cd frontend && npm install && npm run build && npx serve -s build -l 3000
```

### **Full-Stack Deployment (Future Setup)**
```bash
# Install all dependencies
npm run install:all

# Deploy complete stack
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

## 📁 Project Structure

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
└── DEPLOYMENT-STRATEGIES.md  # Detailed deployment guide
```

## 🎯 Deployment Scenarios

### **Scenario 1: Frontend-Only**
- **Use Case:** Single admin, localStorage data storage
- **Best For:** Simple deployments, local hosting
- **Data Storage:** Browser localStorage
- **Deployment:** Netlify, Vercel, local server

### **Scenario 2: Full-Stack**
- **Use Case:** Multiple admins, centralized data
- **Best For:** Production deployments, multi-user environments
- **Data Storage:** MongoDB database
- **Deployment:** Docker, cloud VPS, local server

## 🔧 Available Scripts

### **Root Level:**
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run build            # Build both frontend and backend
npm run install:all      # Install all dependencies
```

### **Deployment Scripts:**
```bash
./deploy-frontend-only.sh docker  # Deploy frontend with Docker
./deploy-frontend-only.sh local   # Deploy frontend with local server
./deploy-frontend-only.sh cloud   # Deploy frontend to cloud

./deploy-fullstack.sh docker      # Deploy full stack with Docker
./deploy-fullstack.sh dev         # Start development environment
./deploy-fullstack.sh prod        # Deploy production with nginx
```

## 🌐 Access Points

### **Frontend-Only:**
- **Application:** http://localhost:3000
- **Data Storage:** Browser localStorage

### **Full-Stack:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **MongoDB:** localhost:27017

## 📊 Features

### **Current Features (Frontend-Only):**
- ✅ User authentication (admin/student)
- ✅ Exam creation and management
- ✅ Question upload (Word/Excel)
- ✅ Multiple active exams
- ✅ Student exam taking
- ✅ Results tracking
- ✅ Data persistence (localStorage)

### **Future Features (Full-Stack):**
- 🔄 Centralized data storage
- 🔄 Multi-admin collaboration
- 🔄 Real-time updates
- 🔄 Advanced analytics
- 🔄 Data backup/restore
- 🔄 User management

## 🔒 Security

### **Frontend-Only:**
- ✅ HTTPS (automatic with cloud hosting)
- ✅ Content Security Policy
- ⚠️ Data stored in browser

### **Full-Stack:**
- ✅ HTTPS with SSL certificates
- ✅ API authentication (JWT)
- ✅ Database security
- ✅ Rate limiting
- ✅ Input validation

## 📞 Support

For detailed deployment instructions, see [DEPLOYMENT-STRATEGIES.md](./DEPLOYMENT-STRATEGIES.md)

For troubleshooting and configuration, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🎯 Recommendation

**Start with Frontend-Only** for simple deployments, then upgrade to Full-Stack when you need:
- Multiple admin collaboration
- Centralized data management
- Advanced features
- Production scalability

This flexible structure allows you to serve different clients with different needs using the same codebase! 