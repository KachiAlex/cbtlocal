# CBT Database Setup Guide

This guide will help you set up MongoDB Atlas (cloud database) and connect it to your deployed CBT application.

## 🎯 **The Problem**
Your CBT system is deployed but still using local database, so:
- User registrations aren't saved
- Exam data isn't shared
- Admin can't see users

## ✅ **Solution: MongoDB Atlas Setup**

### **Step 1: Create MongoDB Atlas Account**

1. **Go to [MongoDB Atlas](https://www.mongodb.com/atlas)**
2. **Click "Try Free"**
3. **Create an account** (use your email)
4. **Choose "Free" plan** (M0 Sandbox)

### **Step 2: Create a Cluster**

1. **Click "Build a Database"**
2. **Choose "FREE" tier** (M0 Sandbox)
3. **Select cloud provider**: AWS, Google Cloud, or Azure
4. **Choose region**: Select closest to your users
5. **Click "Create"**

### **Step 3: Set Up Database Access**

1. **Go to "Database Access"** (left sidebar)
2. **Click "Add New Database User"**
3. **Username**: `cbt_admin`
4. **Password**: Create a strong password (save it!)
5. **Database User Privileges**: "Read and write to any database"
6. **Click "Add User"**

### **Step 4: Set Up Network Access**

1. **Go to "Network Access"** (left sidebar)
2. **Click "Add IP Address"**
3. **Click "Allow Access from Anywhere"** (0.0.0.0/0)
4. **Click "Confirm"**

### **Step 5: Get Connection String**

1. **Go to "Database"** (left sidebar)
2. **Click "Connect"**
3. **Choose "Connect your application"**
4. **Copy the connection string**

**Example connection string:**
```
mongodb+srv://cbt_admin:yourpassword@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

### **Step 6: Update Render Environment Variables**

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Select your CBT backend service** (`cbt-rew7`)
3. **Go to "Environment" tab**
4. **Add these environment variables:**

```
MONGODB_URI=mongodb+srv://cbt_admin:yourpassword@cluster0.abc123.mongodb.net/cbt_database?retryWrites=true&w=majority
DB_TYPE=mongodb
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_2024_cbt
```

**Important:**
- Replace `yourpassword` with your actual password
- Replace `cluster0.abc123.mongodb.net` with your actual cluster URL
- Add `/cbt_database` at the end to specify database name

### **Step 7: Redeploy Your Backend**

1. **After adding environment variables, Render will auto-redeploy**
2. **Wait for deployment to complete**
3. **Check the logs** to see if database connects successfully

### **Step 8: Test the Connection**

1. **Visit your backend health check**: `https://cbt-rew7.onrender.com/health`
2. **You should see database connection info**
3. **Try registering a new user**
4. **Check if user appears in admin dashboard**

## 🔧 **Troubleshooting**

### **If Database Connection Fails:**

1. **Check your connection string** - Make sure password is correct
2. **Check Network Access** - Make sure it's set to "Allow from anywhere"
3. **Check Database User** - Make sure user has read/write permissions
4. **Check Render logs** - Look for connection errors

### **If Users Still Don't Appear:**

1. **Check if backend is using cloud database** - Look at Render logs
2. **Verify environment variables** - Make sure they're set correctly
3. **Test API endpoints** - Try creating a user via API

## 📊 **Expected Results**

After setup:
- ✅ New user registrations will be saved to cloud database
- ✅ Admin dashboard will show all users
- ✅ Exam data will be shared across all users
- ✅ Data persists between deployments

## 🚀 **Next Steps**

Once database is working:
1. **Test user registration**
2. **Test admin dashboard**
3. **Create some sample exams**
4. **Test exam taking functionality**

## 📞 **Need Help?**

If you encounter issues:
1. **Check Render deployment logs**
2. **Verify MongoDB Atlas connection**
3. **Test API endpoints directly**
4. **Check browser console for errors**

Your CBT system will be fully functional once the database is connected! 🎯 