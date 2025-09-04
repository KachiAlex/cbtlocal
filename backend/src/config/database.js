const mongoose = require('mongoose');

// Database configuration
const connectDB = async () => {
  const dbType = process.env.DB_TYPE || 'mongodb';
  
  try {
    if (dbType === 'mongodb') {
      // MongoDB Atlas connection
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } else if (dbType === 'supabase') {
      // Supabase connection (PostgreSQL)
      // Note: For Supabase, you'd typically use a different ORM like Prisma or Sequelize
      console.log('⚠️ Supabase connection requires additional setup with Prisma/Sequelize');
      console.log('📝 For now, using MongoDB. To use Supabase, update DB_TYPE=supabase');
    }
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 