const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Cloud database connection
const CLOUD_MONGODB_URI = 'mongodb+srv://Kachianietie:Dabonega$reus2660@cluster0.1mos0xn.mongodb.net/cbt_database?retryWrites=true&w=majority&appName=Cluster0';

// Path to the exported data file
const EXPORT_FILE_PATH = path.join(__dirname, '..', '761d46e2a5f95ceb67b9a78d8570796ecee1e081e0d05ae2e468ac6691d2b429');

// Schemas
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date,
  updatedAt: Date
});

const examSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: Number,
  questions: Array,
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
});

const resultSchema = new mongoose.Schema({
  userId: String,
  examId: String,
  score: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  timeTaken: Number,
  submittedAt: Date
});

async function restoreFromExport() {
  console.log('🚀 Restoring Data from Export...\n');
  
  // Check if export file exists
  if (!fs.existsSync(EXPORT_FILE_PATH)) {
    console.error('❌ Export file not found:', EXPORT_FILE_PATH);
    console.log('Please make sure the export file is in the CBT directory');
    return;
  }
  
  console.log('📁 Found export file:', path.basename(EXPORT_FILE_PATH));
  console.log('📊 File size:', (fs.statSync(EXPORT_FILE_PATH).size / 1024).toFixed(2), 'KB');
  
  let connection;
  
  try {
    // Connect to cloud database
    console.log('\n☁️ Connecting to cloud database...');
    connection = await mongoose.connect(CLOUD_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to cloud database');
    
    // Read the export file
    console.log('\n📖 Reading export file...');
    const fileContent = fs.readFileSync(EXPORT_FILE_PATH);
    
    // Try to parse as JSON first
    try {
      const jsonData = JSON.parse(fileContent.toString());
      console.log('✅ Successfully parsed as JSON');
      
      // Create models
      const User = mongoose.model('User', userSchema);
      const Exam = mongoose.model('Exam', examSchema);
      const Result = mongoose.model('Result', resultSchema);
      
      // Restore data
      if (jsonData.users && jsonData.users.length > 0) {
        console.log(`\n👥 Restoring ${jsonData.users.length} users...`);
        await User.insertMany(jsonData.users);
        console.log('✅ Users restored successfully');
      }
      
      if (jsonData.exams && jsonData.exams.length > 0) {
        console.log(`\n📝 Restoring ${jsonData.exams.length} exams...`);
        await Exam.insertMany(jsonData.exams);
        console.log('✅ Exams restored successfully');
      }
      
      if (jsonData.results && jsonData.results.length > 0) {
        console.log(`\n📊 Restoring ${jsonData.results.length} results...`);
        await Result.insertMany(jsonData.results);
        console.log('✅ Results restored successfully');
      }
      
      console.log('\n🎉 Data restoration completed successfully!');
      
    } catch (jsonError) {
      console.log('❌ Not a JSON file, trying other formats...');
      console.log('This might be a MongoDB dump or compressed file');
      console.log('You may need to use MongoDB tools to restore this file');
      
      // Try to detect file type
      const fileHeader = fileContent.slice(0, 10);
      console.log('File header:', fileHeader.toString('hex'));
      
      if (fileHeader.includes('BSON')) {
        console.log('This appears to be a BSON file');
        console.log('Use: mongorestore --uri="your-connection-string" filename');
      } else if (fileHeader.includes('PK')) {
        console.log('This appears to be a ZIP file');
        console.log('Extract it first, then restore the contents');
      } else {
        console.log('Unknown file format');
        console.log('Try opening it with a text editor to see the format');
      }
    }
    
  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  } finally {
    if (connection) {
      await connection.disconnect();
      console.log('\n🔌 Disconnected from cloud database');
    }
  }
}

// Run restoration
restoreFromExport(); 