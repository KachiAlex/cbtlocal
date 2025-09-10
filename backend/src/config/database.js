const mongoose = require('mongoose');

// Database configuration with enhanced error handling
const connectDB = async () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  
  try {
    if (dbType === 'mongodb') {
      console.log('🔄 Attempting to connect to MongoDB...');
      console.log(`🔗 Connection URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
      
      // MongoDB Atlas connection with enhanced options
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        // Cloud database connection options
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // Increased timeout
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000, // Added connection timeout
        retryWrites: true,
        retryReads: true
      });
      
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
      console.log(`🌐 Database: ${conn.connection.name}`);
      console.log(`🔗 Connection String: ${process.env.MONGODB_URI.includes('mongodb+srv://') ? 'Cloud (Atlas)' : 'Local'}`);
      console.log(`📊 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      
      // Set up connection event listeners
      conn.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });
      
      conn.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
      });
      
      conn.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
      });
      
    } else if (dbType === 'supabase') {
      // Supabase connection (PostgreSQL)
      console.log('⚠️ Supabase connection requires additional setup with Prisma/Sequelize');
      console.log('📝 For now, using MongoDB. To use Supabase, update DB_TYPE=supabase');
    }
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    console.error(`🔍 Error details:`, {
      name: error.name,
      code: error.code,
      message: error.message
    });
    
    // Provide specific guidance based on error type
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error(`🚨 IP WHITELIST ISSUE DETECTED:`);
      console.error(`   1. Go to MongoDB Atlas Dashboard`);
      console.error(`   2. Click "Network Access"`);
      console.error(`   3. Add IP Address: 0.0.0.0/0 (Allow from anywhere)`);
      console.error(`   4. Wait 2 minutes for changes to apply`);
    } else if (error.message.includes('authentication')) {
      console.error(`🔐 AUTHENTICATION ISSUE:`);
      console.error(`   Check your MongoDB username and password`);
    } else if (error.message.includes('timeout')) {
      console.error(`⏱️ CONNECTION TIMEOUT:`);
      console.error(`   Check your internet connection and MongoDB URI`);
    }
    
    console.error(`🔍 Check your MONGODB_URI and network connection`);
    console.error(`📋 Current environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Don't exit the process immediately - let the app run with fallback
    console.warn('⚠️ Continuing without database connection - using fallback mode');
  }
};

module.exports = connectDB; 