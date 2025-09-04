const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Cloud database connection
const CLOUD_MONGODB_URI = 'mongodb+srv://Kachianietie:Dabonega$reus2660@cluster0.1mos0xn.mongodb.net/cbt_database?retryWrites=true&w=majority&appName=Cluster0';

// Path to the existing backup file
const BACKUP_FILE = path.join(__dirname, 'CBT_Data_Backup_2025-08-28.json');

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

async function importFromBackup() {
  console.log('🚀 Importing from Local Backup to Cloud...\n');

  if (!fs.existsSync(BACKUP_FILE)) {
    console.error('❌ Backup file not found:', BACKUP_FILE);
    console.log('Please make sure CBT_Data_Backup_2025-08-28.json exists in the backend directory');
    return;
  }

  const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Failed to parse backup JSON:', e.message);
    return;
  }

  const users = Array.isArray(data.users) ? data.users : [];
  const exams = Array.isArray(data.exams) ? data.exams : [];
  const results = Array.isArray(data.results) ? data.results : [];
  const questions = Array.isArray(data.questions) ? data.questions : [];

  console.log(`📦 Found in backup:`);
  console.log(`   👥 Users: ${users.length}`);
  console.log(`   📝 Exams: ${exams.length}`);
  console.log(`   📊 Results: ${results.length}`);
  console.log(`   ❓ Questions: ${questions.length}`);

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

    // Clear existing data
    console.log('\n🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Exam.deleteMany({}),
      Result.deleteMany({}),
      Question.deleteMany({}),
    ]);
    console.log('✅ Cleared existing documents');

    // Import data
    if (users.length) {
      console.log(`\n👥 Importing ${users.length} users...`);
      await User.insertMany(users);
      console.log('✅ Users imported');
    }

    if (exams.length) {
      console.log(`\n📝 Importing ${exams.length} exams...`);
      await Exam.insertMany(exams);
      console.log('✅ Exams imported');
    }

    if (results.length) {
      console.log(`\n📊 Importing ${results.length} results...`);
      await Result.insertMany(results);
      console.log('✅ Results imported');
    }

    if (questions.length) {
      console.log(`\n❓ Importing ${questions.length} questions...`);
      await Question.insertMany(questions);
      console.log('✅ Questions imported');
    }

    console.log('\n🎉 Import completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy the updated backend to Render');
    console.log('2. Test the API endpoints:');
    console.log('   - https://cbt-rew7.onrender.com/api/users');
    console.log('   - https://cbt-rew7.onrender.com/api/exams');
    console.log('   - https://cbt-rew7.onrender.com/api/questions');
    console.log('   - https://cbt-rew7.onrender.com/api/results');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
  } finally {
    if (connection) {
      await connection.disconnect();
      console.log('\n🔌 Disconnected from cloud database');
    }
  }
}

importFromBackup(); 