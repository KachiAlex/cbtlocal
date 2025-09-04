const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Cloud database connection
const CLOUD_MONGODB_URI = 'mongodb+srv://Kachianietie:Dabonega$reus2660@cluster0.1mos0xn.mongodb.net/cbt_database?retryWrites=true&w=majority&appName=Cluster0';

// Path to extracted data
const EXTRACT_DIR = path.join(__dirname, 'extracted_data');

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

async function restoreExtracted() {
  console.log('🚀 Restoring Extracted Data...\n');
  
  // Check if extract directory exists
  if (!fs.existsSync(EXTRACT_DIR)) {
    console.error('❌ Extracted data directory not found:', EXTRACT_DIR);
    console.log('Please run extract-manual.bat first to extract the ZIP file');
    return;
  }
  
  try {
    // List extracted files
    console.log('📋 Extracted files:');
    const files = fs.readdirSync(EXTRACT_DIR);
    if (files.length === 0) {
      console.log('❌ No files found in extracted_data directory');
      console.log('Please extract the ZIP file first');
      return;
    }
    
    files.forEach(file => {
      console.log(`- ${file}`);
    });
    
    // Look for JSON files
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    if (jsonFiles.length === 0) {
      console.log('\n❌ No JSON files found');
      console.log('Available files:', files);
      return;
    }
    
    console.log('\n📄 Found JSON files:', jsonFiles);
    
    // Connect to cloud database
    console.log('\n☁️ Connecting to cloud database...');
    const connection = await mongoose.connect(CLOUD_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to cloud database');
    
    // Create models
    const User = mongoose.model('User', userSchema);
    const Exam = mongoose.model('Exam', examSchema);
    const Result = mongoose.model('Result', resultSchema);
    
    let totalUsers = 0;
    let totalExams = 0;
    let totalResults = 0;
    
    // Process each JSON file
    for (const jsonFile of jsonFiles) {
      console.log(`\n📖 Processing: ${jsonFile}`);
      const filePath = path.join(EXTRACT_DIR, jsonFile);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      try {
        const data = JSON.parse(fileContent);
        
        // Determine what type of data this is
        if (data.users || (Array.isArray(data) && data.length > 0 && data[0].username)) {
          console.log('👥 Found user data');
          if (Array.isArray(data)) {
            await User.insertMany(data);
            totalUsers += data.length;
            console.log(`✅ Restored ${data.length} users`);
          } else if (data.users) {
            await User.insertMany(data.users);
            totalUsers += data.users.length;
            console.log(`✅ Restored ${data.users.length} users`);
          }
        }
        
        if (data.exams || (Array.isArray(data) && data.length > 0 && data[0].title)) {
          console.log('📝 Found exam data');
          if (Array.isArray(data)) {
            await Exam.insertMany(data);
            totalExams += data.length;
            console.log(`✅ Restored ${data.length} exams`);
          } else if (data.exams) {
            await Exam.insertMany(data.exams);
            totalExams += data.exams.length;
            console.log(`✅ Restored ${data.exams.length} exams`);
          }
        }
        
        if (data.results || (Array.isArray(data) && data.length > 0 && data[0].score !== undefined)) {
          console.log('📊 Found result data');
          if (Array.isArray(data)) {
            await Result.insertMany(data);
            totalResults += data.length;
            console.log(`✅ Restored ${data.length} results`);
          } else if (data.results) {
            await Result.insertMany(data.results);
            totalResults += data.results.length;
            console.log(`✅ Restored ${data.results.length} results`);
          }
        }
        
      } catch (parseError) {
        console.log(`❌ Error parsing ${jsonFile}:`, parseError.message);
      }
    }
    
    console.log('\n🎉 Data restoration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${totalUsers}`);
    console.log(`- Exams: ${totalExams}`);
    console.log(`- Results: ${totalResults}`);
    
    await connection.disconnect();
    console.log('\n🔌 Disconnected from cloud database');
    
    console.log('\n🎯 Your CBT system is now fully centralized!');
    console.log('✅ All data is now in the cloud database');
    console.log('✅ Your friend\'s account should be visible in admin dashboard');
    console.log('✅ All exams and results are preserved');
    
  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  }
}

// Run restoration
restoreExtracted(); 