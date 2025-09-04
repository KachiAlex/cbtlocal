# Database Setup Guide

This guide covers database setup for different deployment scenarios.

## 🎯 **Database Requirements by Deployment Type**

### **Frontend-Only Deployment (Client A)**
❌ **NO DATABASE NEEDED**
- Uses **localStorage** for data storage
- All data stored in the browser
- No external database required

### **Full-Stack Deployment (Client B)**
✅ **DATABASE REQUIRED**
- Uses centralized database for data storage
- Multiple options available

## 🗄️ **Database Options**

### **Option 1: MongoDB Atlas (Recommended)**

#### **Why MongoDB Atlas?**
- ✅ **Free tier** available (512MB)
- ✅ **Easy setup** and management
- ✅ **Automatic backups** and scaling
- ✅ **Perfect for** JSON-like data (exams, questions, results)
- ✅ **Built-in security** and monitoring

#### **Setup Steps:**

1. **Create MongoDB Atlas Account:**
   ```bash
   # Go to https://mongodb.com/atlas
   # Click "Try Free"
   # Create account
   ```

2. **Create Cluster:**
   ```bash
   # Choose "FREE" tier
   # Select cloud provider (AWS, Google Cloud, Azure)
   # Choose region closest to your users
   # Click "Create Cluster"
   ```

3. **Set Up Database Access:**
   ```bash
   # Go to "Database Access"
   # Click "Add New Database User"
   # Username: cbt_admin
   # Password: [generate strong password]
   # Role: "Read and write to any database"
   # Click "Add User"
   ```

4. **Set Up Network Access:**
   ```bash
   # Go to "Network Access"
   # Click "Add IP Address"
   # Click "Allow Access from Anywhere" (0.0.0.0/0)
   # Click "Confirm"
   ```

5. **Get Connection String:**
   ```bash
   # Go to "Clusters"
   # Click "Connect"
   # Choose "Connect your application"
   # Copy connection string
   ```

6. **Update Environment Variables:**
   ```env
   # .env file
   DB_TYPE=mongodb
   MONGODB_URI=mongodb+srv://cbt_admin:password@cluster.mongodb.net/cbt?retryWrites=true&w=majority
   ```

### **Option 2: Supabase (Alternative)**

#### **Why Supabase?**
- ✅ **Free tier** available
- ✅ **PostgreSQL-based** (SQL database)
- ✅ **Built-in authentication** and real-time features
- ✅ **Great for** relational data
- ✅ **Auto-generated APIs**

#### **Setup Steps:**

1. **Create Supabase Account:**
   ```bash
   # Go to https://supabase.com
   # Click "Start your project"
   # Create account
   ```

2. **Create Project:**
   ```bash
   # Click "New Project"
   # Choose organization
   # Project name: cbt-app
   # Database password: [generate strong password]
   # Region: closest to your users
   # Click "Create new project"
   ```

3. **Get Connection Details:**
   ```bash
   # Go to "Settings" > "Database"
   # Copy connection string
   # Note: Host, Database, Port, User, Password
   ```

4. **Update Environment Variables:**
   ```env
   # .env file
   DB_TYPE=supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## 🔧 **Environment Variables**

### **For MongoDB Atlas:**
```env
# Backend .env
NODE_ENV=production
PORT=5000
DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cbt?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-frontend-url.com
```

### **For Supabase:**
```env
# Backend .env
NODE_ENV=production
PORT=5000
DB_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-frontend-url.com
```

## 📊 **Database Schema (MongoDB)**

### **Collections Structure:**

```javascript
// Exams Collection
{
  _id: ObjectId,
  title: String,
  description: String,
  duration: Number,
  questionCount: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Questions Collection
{
  _id: ObjectId,
  examId: ObjectId,
  question: String,
  options: [String],
  correctAnswer: Number,
  createdAt: Date
}

// Results Collection
{
  _id: ObjectId,
  examId: ObjectId,
  studentName: String,
  studentId: String,
  score: Number,
  totalQuestions: Number,
  answers: [Number],
  timeTaken: Number,
  submittedAt: Date
}

// Users Collection
{
  _id: ObjectId,
  username: String,
  password: String, // hashed
  role: String, // 'admin' or 'student'
  createdAt: Date
}
```

## 🚀 **Quick Setup Commands**

### **MongoDB Atlas Setup:**
```bash
# 1. Create account and cluster
# 2. Get connection string
# 3. Update .env file
# 4. Test connection

curl http://localhost:5000/health
# Should return: {"database": "mongodb", "status": "healthy"}
```

### **Supabase Setup:**
```bash
# 1. Create project
# 2. Get connection details
# 3. Update .env file
# 4. Test connection

curl http://localhost:5000/health
# Should return: {"database": "supabase", "status": "healthy"}
```

## 🔒 **Security Considerations**

### **MongoDB Atlas:**
- ✅ **Network Access:** Restrict IP addresses
- ✅ **Database Users:** Use strong passwords
- ✅ **Encryption:** Enabled by default
- ✅ **Backups:** Automatic daily backups

### **Supabase:**
- ✅ **Row Level Security:** Enable RLS policies
- ✅ **API Keys:** Use service role key for admin operations
- ✅ **Encryption:** Data encrypted at rest
- ✅ **Backups:** Automatic backups

## 💰 **Cost Comparison**

### **Free Tiers:**

| Service | Free Tier | Limitations |
|---------|-----------|-------------|
| **MongoDB Atlas** | 512MB storage | Shared cluster, 500 connections |
| **Supabase** | 500MB storage | 2 projects, 50,000 monthly active users |

### **Paid Plans:**

| Service | Starting Price | Features |
|---------|---------------|----------|
| **MongoDB Atlas** | $9/month | Dedicated cluster, 10GB storage |
| **Supabase** | $25/month | 8GB storage, 100,000 monthly active users |

## 🎯 **Recommendation**

### **For CBT App:**
**Use MongoDB Atlas** because:
- ✅ **JSON-like data** (exams, questions) fits MongoDB perfectly
- ✅ **Simple setup** and management
- ✅ **Free tier** sufficient for most clients
- ✅ **Easy scaling** as your business grows
- ✅ **Built-in security** and monitoring

### **When to Consider Supabase:**
- 🔄 **Complex relationships** between data
- 🔄 **Built-in authentication** needed
- 🔄 **Real-time features** required
- 🔄 **SQL queries** preferred

## 📞 **Support**

### **MongoDB Atlas Support:**
- 📧 **Email support** for free tier
- 💬 **Live chat** for paid plans
- 📚 **Extensive documentation**

### **Supabase Support:**
- 💬 **Discord community**
- 📚 **Documentation and tutorials**
- 🎥 **Video guides**

## 🚀 **Next Steps**

1. **Choose your database** (MongoDB Atlas recommended)
2. **Set up the database** following the steps above
3. **Update environment variables** in your backend
4. **Test the connection** using the health endpoint
5. **Deploy your application** with database support

**Your CBT app will be ready for production with a professional database setup!** 🎉 