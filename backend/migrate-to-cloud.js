const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Database connection strings
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/cbt_database';
const CLOUD_MONGODB_URI = 'mongodb+srv://Kachianietie:Dabonega$reus2660@cluster0.1mos0xn.mongodb.net/cbt_database?retryWrites=true&w=majority&appName=Cluster0';

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date,
  updatedAt: Date
});

// Exam Schema
const examSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: Number,
  questions: Array,
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
});

// Result Schema
const resultSchema = new mongoose.Schema({
  userId: String,
  examId: String,
  score: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  timeTaken: Number,
  submittedAt: Date
});

// Create models
const User = mongoose.model('User', userSchema);
const Exam = mongoose.model('Exam', examSchema);
const Result = mongoose.model('Result', resultSchema);

async function migrateData() {
  console.log('🚀 Starting Database Migration...\n');
  
  let localConnection, cloudConnection;
  
  try {
    // Connect to local database
    console.log('📡 Connecting to local database...');
    localConnection = await mongoose.createConnection(LOCAL_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to local database');
    
    // Connect to cloud database
    console.log('☁️ Connecting to cloud database...');
    cloudConnection = await mongoose.createConnection(CLOUD_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to cloud database\n');
    
    // Create models for local and cloud connections
    const LocalUser = localConnection.model('User', userSchema);
    const LocalExam = localConnection.model('Exam', examSchema);
    const LocalResult = localConnection.model('Result', resultSchema);
    
    const CloudUser = cloudConnection.model('User', userSchema);
    const CloudExam = cloudConnection.model('Exam', examSchema);
    const CloudResult = cloudConnection.model('Result', resultSchema);
    
    // Migrate Users
    console.log('👥 Migrating users...');
    const users = await LocalUser.find({});
    if (users.length > 0) {
      await CloudUser.insertMany(users);
      console.log(`✅ Migrated ${users.length} users`);
    } else {
      console.log('ℹ️ No users to migrate');
    }
    
    // Migrate Exams
    console.log('📝 Migrating exams...');
    const exams = await LocalExam.find({});
    if (exams.length > 0) {
      await CloudExam.insertMany(exams);
      console.log(`✅ Migrated ${exams.length} exams`);
    } else {
      console.log('ℹ️ No exams to migrate');
    }
    
    // Migrate Results
    console.log('📊 Migrating results...');
    const results = await LocalResult.find({});
    if (results.length > 0) {
      await CloudResult.insertMany(results);
      console.log(`✅ Migrated ${results.length} results`);
    } else {
      console.log('ℹ️ No results to migrate');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Exams: ${exams.length}`);
    console.log(`- Results: ${results.length}`);
    
    // Create backup file
    const backupData = {
      users: users,
      exams: exams,
      results: results,
      migratedAt: new Date(),
      totalRecords: users.length + exams.length + results.length
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'migration-backup.json'),
      JSON.stringify(backupData, null, 2)
    );
    console.log('\n💾 Backup saved to: migration-backup.json');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your local MongoDB is running');
    console.log('2. Check your cloud MongoDB connection string');
    console.log('3. Verify MongoDB Atlas IP whitelist includes your IP');
  } finally {
    // Close connections
    if (localConnection) {
      await localConnection.close();
      console.log('🔌 Closed local database connection');
    }
    if (cloudConnection) {
      await cloudConnection.close();
      console.log('🔌 Closed cloud database connection');
    }
  }
}

// Run migration
migrateData(); 