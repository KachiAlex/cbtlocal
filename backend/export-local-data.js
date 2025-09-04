const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Local database connection
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/cbt_database';

// Schemas (same as restore script)
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  fullName: String,
  registeredAt: Date,
  createdAt: Date,
  updatedAt: Date,
}, { strict: false });

const examSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  duration: Number,
  questionCount: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  questions: Array,
}, { strict: false });

const resultSchema = new mongoose.Schema({
  username: String,
  userId: String,
  examId: String,
  examTitle: String,
  score: Number,
  total: Number,
  percent: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  timeTaken: Number,
  submittedAt: Date,
  answers: Array,
  questionOrder: Array,
}, { strict: false });

const questionSchema = new mongoose.Schema({
  id: String,
  text: String,
  options: Array,
  correctIndex: Number,
}, { strict: false });

async function exportLocalData() {
  console.log('🚀 Exporting Local Database Data...\n');

  let connection;
  
  try {
    // Connect to local database
    console.log('📡 Connecting to local database...');
    connection = await mongoose.connect(LOCAL_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to local database');

    // Create models
    const User = mongoose.model('User', userSchema);
    const Exam = mongoose.model('Exam', examSchema);
    const Result = mongoose.model('Result', resultSchema);
    const Question = mongoose.model('Question', questionSchema);

    // Export data
    console.log('\n📤 Exporting collections...');

    const users = await User.find({}).lean();
    const exams = await Exam.find({}).lean();
    const results = await Result.find({}).lean();
    const questions = await Question.find({}).lean();

    console.log(`👥 Found ${users.length} users`);
    console.log(`📝 Found ${exams.length} exams`);
    console.log(`📊 Found ${results.length} results`);
    console.log(`❓ Found ${questions.length} questions`);

    // Create export data structure
    const exportData = {
      users: users,
      exams: exams,
      results: results,
      questions: questions,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    // Write to file
    const exportFile = path.join(__dirname, 'local-data-export.json');
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    
    console.log(`\n💾 Data exported to: ${exportFile}`);
    console.log(`📊 File size: ${(fs.statSync(exportFile).size / 1024).toFixed(2)} KB`);

    console.log('\n🎉 Export completed successfully!');

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is running: mongod');
    console.log('2. Check if the database name is correct');
    console.log('3. Verify the connection string');
  } finally {
    if (connection) {
      await connection.disconnect();
      console.log('\n🔌 Disconnected from local database');
    }
  }
}

exportLocalData(); 