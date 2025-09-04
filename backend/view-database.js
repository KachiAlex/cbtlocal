const mongoose = require('mongoose');

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

async function viewDatabase() {
  console.log('🔍 Viewing MongoDB Atlas Database...\n');

  let connection;
  
  try {
    console.log('☁️ Connecting to cloud database...');
    connection = await mongoose.connect(CLOUD_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to cloud database\n');

    const User = mongoose.model('User', userSchema);
    const Exam = mongoose.model('Exam', examSchema);
    const Result = mongoose.model('Result', resultSchema);
    const Question = mongoose.model('Question', questionSchema);

    // Get all data
    const users = await User.find({}).lean();
    const exams = await Exam.find({}).lean();
    const results = await Result.find({}).lean();
    const questions = await Question.find({}).lean();

    console.log('📊 DATABASE CONTENTS:');
    console.log('='.repeat(50));

    // Users
    console.log(`\n👥 USERS (${users.length}):`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} (${user.role}) - ${user.email || 'No email'}`);
    });

    // Exams
    console.log(`\n📝 EXAMS (${exams.length}):`);
    exams.forEach((exam, index) => {
      console.log(`  ${index + 1}. ${exam.title} - ${exam.questionCount || 0} questions - ${exam.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    });

    // Questions
    console.log(`\n❓ QUESTIONS (${questions.length}):`);
    questions.forEach((question, index) => {
      console.log(`  ${index + 1}. ${question.text?.substring(0, 60)}...`);
    });

    // Results
    console.log(`\n📊 RESULTS (${results.length}):`);
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.username} - ${result.examTitle} - Score: ${result.score}/${result.total} (${result.percent}%)`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('🎯 API ENDPOINTS:');
    console.log('  Users: https://cbt-rew7.onrender.com/api/users');
    console.log('  Exams: https://cbt-rew7.onrender.com/api/exams');
    console.log('  Questions: https://cbt-rew7.onrender.com/api/questions');
    console.log('  Results: https://cbt-rew7.onrender.com/api/results');

  } catch (error) {
    console.error('❌ Error viewing database:', error.message);
  } finally {
    if (connection) {
      await connection.disconnect();
      console.log('\n🔌 Disconnected from cloud database');
    }
  }
}

viewDatabase(); 