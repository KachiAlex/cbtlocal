const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Cloud database connection
const CLOUD_MONGODB_URI = 'mongodb+srv://Kachianietie:Dabonega$reus2660@cluster0.1mos0xn.mongodb.net/cbt_database?retryWrites=true&w=majority&appName=Cluster0';

// Schemas
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

async function syncToLocalStorage() {
  console.log('🔄 Syncing MongoDB Atlas data to localStorage format...\n');

  let connection;
  
  try {
    console.log('☁️ Connecting to cloud database...');
    connection = await mongoose.connect(CLOUD_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to cloud database');

    const User = mongoose.model('User', userSchema);
    const Exam = mongoose.model('Exam', examSchema);
    const Result = mongoose.model('Result', resultSchema);
    const Question = mongoose.model('Question', questionSchema);

    // Get all data
    const users = await User.find({}).lean();
    const exams = await Exam.find({}).lean();
    const results = await Result.find({}).lean();
    const questions = await Question.find({}).lean();

    console.log(`📦 Found: ${users.length} users, ${exams.length} exams, ${results.length} results, ${questions.length} questions`);

    // Create localStorage backup format
    const localStorageData = {
      users: users,
      exams: exams,
      results: results,
      questions: questions,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    // Write to file
    const backupFile = path.join(__dirname, 'localStorage-backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(localStorageData, null, 2));
    
    console.log(`\n💾 localStorage backup created: ${backupFile}`);
    console.log(`📊 File size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

    // Create individual localStorage files for easy import
    const localStorageDir = path.join(__dirname, 'localStorage-files');
    if (!fs.existsSync(localStorageDir)) {
      fs.mkdirSync(localStorageDir);
    }

    // Users
    fs.writeFileSync(
      path.join(localStorageDir, 'cbt_users_v1.json'), 
      JSON.stringify(users, null, 2)
    );

    // Exams
    fs.writeFileSync(
      path.join(localStorageDir, 'cbt_exams_v1.json'), 
      JSON.stringify(exams, null, 2)
    );

    // Results
    fs.writeFileSync(
      path.join(localStorageDir, 'cbt_results_v1.json'), 
      JSON.stringify(results, null, 2)
    );

    // Questions
    fs.writeFileSync(
      path.join(localStorageDir, 'cbt_questions_v1.json'), 
      JSON.stringify(questions, null, 2)
    );

    console.log('\n📁 Individual localStorage files created in: localStorage-files/');
    console.log('   - cbt_users_v1.json');
    console.log('   - cbt_exams_v1.json');
    console.log('   - cbt_results_v1.json');
    console.log('   - cbt_questions_v1.json');

    console.log('\n🎯 To import into frontend:');
    console.log('1. Copy the JSON content from localStorage-files/');
    console.log('2. Open browser console on your CBT app');
    console.log('3. Run: localStorage.setItem("cbt_users_v1", JSON.stringify(usersData))');
    console.log('4. Repeat for other collections');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  } finally {
    if (connection) {
      await connection.disconnect();
      console.log('\n🔌 Disconnected from cloud database');
    }
  }
}

syncToLocalStorage(); 