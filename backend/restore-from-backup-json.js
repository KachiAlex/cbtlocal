const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Cloud database connection
const CLOUD_MONGODB_URI = 'mongodb+srv://Kachianietie:Dabonega$reus2660@cluster0.1mos0xn.mongodb.net/cbt_database?retryWrites=true&w=majority&appName=Cluster0';

// Path to the JSON backup file
const BACKUP_FILE = path.join(__dirname, 'CBT_Data_Backup_2025-08-28.json');

// Define minimal schemas to accept incoming fields
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

async function restoreFromBackup() {
  console.log('🚀 Restoring from CBT_Data_Backup JSON...\n');

  if (!fs.existsSync(BACKUP_FILE)) {
    console.error('❌ Backup file not found:', BACKUP_FILE);
    process.exit(1);
  }

  const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Failed to parse backup JSON:', e.message);
    process.exit(1);
  }

  const users = Array.isArray(data.users) ? data.users : [];
  const exams = Array.isArray(data.exams) ? data.exams : [];
  const results = Array.isArray(data.results) ? data.results : [];
  const questions = Array.isArray(data.questions) ? data.questions : [];

  console.log(`📦 Found in backup -> users: ${users.length}, exams: ${exams.length}, results: ${results.length}, questions: ${questions.length}`);

  let connection;
  try {
    console.log('\n☁️ Connecting to cloud database...');
    connection = await mongoose.connect(CLOUD_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to cloud database');

    const User = mongoose.model('User', userSchema);
    const Exam = mongoose.model('Exam', examSchema);
    const Result = mongoose.model('Result', resultSchema);
    const Question = mongoose.model('Question', questionSchema);

    // Optional: clear existing documents before inserting to avoid duplicates
    console.log('\n🧹 Clearing existing collections (users, exams, results, questions)...');
    await Promise.all([
      User.deleteMany({}),
      Exam.deleteMany({}),
      Result.deleteMany({}),
      Question.deleteMany({}),
    ]);
    console.log('✅ Cleared existing documents');

    if (users.length) {
      console.log(`\n👥 Inserting ${users.length} users...`);
      await User.insertMany(users);
      console.log('✅ Users inserted');
    }

    if (exams.length) {
      console.log(`\n📝 Inserting ${exams.length} exams...`);
      await Exam.insertMany(exams.map(e => ({ ...e })));
      console.log('✅ Exams inserted');
    }

    if (results.length) {
      console.log(`\n📊 Inserting ${results.length} results...`);
      await Result.insertMany(results);
      console.log('✅ Results inserted');
    }

    if (questions.length) {
      console.log(`\n❓ Inserting ${questions.length} questions...`);
      await Question.insertMany(questions);
      console.log('✅ Questions inserted');
    }

    console.log('\n🎉 Restore completed successfully!');
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
  } finally {
    if (connection) {
      await connection.disconnect();
      console.log('\n🔌 Disconnected from cloud database');
    }
  }
}

restoreFromBackup(); 