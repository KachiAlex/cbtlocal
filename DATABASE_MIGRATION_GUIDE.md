# 🚀 CBT Database Migration Guide

This guide will help you migrate all your local database data to the cloud MongoDB Atlas database.

## 🎯 **What This Migration Does:**

- ✅ **Transfers all users** from local to cloud database
- ✅ **Transfers all exams** from local to cloud database  
- ✅ **Transfers all results** from local to cloud database
- ✅ **Creates a backup** of all migrated data
- ✅ **Preserves all relationships** between data

## 📋 **Prerequisites:**

1. **Local MongoDB running** on your machine
2. **MongoDB Atlas account** set up and whitelisted
3. **Node.js installed** on your machine
4. **Your local database has data** to migrate

## 🚀 **Step-by-Step Migration:**

### **Step 1: Start Local MongoDB**
Make sure your local MongoDB is running:
```bash
# If using MongoDB Community Edition
mongod

# Or if using MongoDB as a service
# It should already be running
```

### **Step 2: Run the Migration**
Navigate to your backend directory and run the migration:

**Option A: Using the batch file (Windows)**
```bash
cd C:\CBT\backend
run-migration.bat
```

**Option B: Using Node.js directly**
```bash
cd C:\CBT\backend
node migrate-to-cloud.js
```

### **Step 3: Monitor the Migration**
The script will show progress:
```
🚀 Starting Database Migration...

📡 Connecting to local database...
✅ Connected to local database

☁️ Connecting to cloud database...
✅ Connected to cloud database

👥 Migrating users...
✅ Migrated 5 users

📝 Migrating exams...
✅ Migrated 3 exams

📊 Migrating results...
✅ Migrated 12 results

🎉 Migration completed successfully!

📋 Summary:
- Users: 5
- Exams: 3
- Results: 12

💾 Backup saved to: migration-backup.json
```

## 🔧 **Troubleshooting:**

### **If Migration Fails:**

1. **Check local MongoDB connection:**
   - Make sure MongoDB is running on localhost:27017
   - Try connecting with MongoDB Compass

2. **Check cloud MongoDB connection:**
   - Verify your connection string is correct
   - Make sure IP whitelist includes your IP

3. **Check network connectivity:**
   - Ensure you can access MongoDB Atlas
   - Check firewall settings

### **Common Error Messages:**

- **"ECONNREFUSED"** - Local MongoDB not running
- **"Authentication failed"** - Wrong cloud credentials
- **"Network timeout"** - Network connectivity issues

## 📊 **After Migration:**

### **Step 1: Verify Data in Cloud**
1. **Go to MongoDB Atlas dashboard**
2. **Browse your `cbt_database`**
3. **Check collections: `users`, `exams`, `results`**
4. **Verify all data is present**

### **Step 2: Test Your Application**
1. **Visit your backend:** `https://cbt-rew7.onrender.com/health`
2. **Check if database shows as connected**
3. **Try logging in with existing users**
4. **Verify all exams are available**

### **Step 3: Update Your Application**
1. **Make sure your Render backend uses the cloud database**
2. **Test user registration and login**
3. **Test exam creation and taking**

## 🎯 **Expected Results:**

After successful migration:
- ✅ All local users can log in to cloud system
- ✅ All local exams are available in cloud system
- ✅ All local results are preserved
- ✅ Your friend's account will be visible in admin dashboard
- ✅ All data is centralized in the cloud

## 🔒 **Backup:**

The migration creates a backup file: `migration-backup.json`
This contains all your data in case you need to restore it.

## 🚀 **Next Steps:**

1. **Run the migration script**
2. **Verify data in MongoDB Atlas**
3. **Test your application**
4. **Your CBT system will be fully centralized!**

**Your local data will now be available in the cloud, and your CBT system will be fully functional!** 🎉 