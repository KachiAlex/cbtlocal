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

async function updateDatabase() {
  console.log('🔄 Database Update Tool\n');

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

    // Example: Add a new user
    console.log('👤 Adding new user...');
    const newUser = {
      username: 'testuser',
      password: 'testpass123',
      role: 'student',
      fullName: 'Test User',
      email: 'test@example.com',
      registeredAt: new Date()
    };
    
    const existingUser = await User.findOne({ username: newUser.username });
    if (!existingUser) {
      await User.create(newUser);
      console.log('✅ New user added:', newUser.username);
    } else {
      console.log('ℹ️ User already exists:', newUser.username);
    }

    // Example: Add a new exam
    console.log('\n📝 Adding new exam...');
    const newExam = {
      id: crypto.randomUUID(),
      title: 'New Test Exam',
      description: 'This is a test exam',
      duration: 60,
      questionCount: 10,
      isActive: true,
      createdAt: new Date()
    };
    
    const existingExam = await Exam.findOne({ title: newExam.title });
    if (!existingExam) {
      await Exam.create(newExam);
      console.log('✅ New exam added:', newExam.title);
    } else {
      console.log('ℹ️ Exam already exists:', newExam.title);
    }

    // Example: Add a new question
    console.log('\n❓ Adding new question...');
    const newQuestion = {
      id: crypto.randomUUID(),
      text: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1
    };
    
    const existingQuestion = await Question.findOne({ text: newQuestion.text });
    if (!existingQuestion) {
      await Question.create(newQuestion);
      console.log('✅ New question added');
    } else {
      console.log('ℹ️ Question already exists');
    }

    // Example: Update an existing exam
    console.log('\n🔄 Updating exam...');
    const examToUpdate = await Exam.findOne({ title: 'Physics Midterm Exam' });
    if (examToUpdate) {
      await Exam.updateOne(
        { _id: examToUpdate._id },
        { $set: { isActive: true, updatedAt: new Date() } }
      );
      console.log('✅ Exam updated: Physics Midterm Exam is now ACTIVE');
    }

    console.log('\n🎉 Database update completed!');
    console.log('\n📋 To add more data, edit this script and run it again.');

  } catch (error) {
    console.error('❌ Error updating database:', error.message);
  } finally {
    if (connection) {
      await connection.disconnect();
      console.log('\n🔌 Disconnected from cloud database');
    }
  }
}

updateDatabase(); 