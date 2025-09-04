const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Cloud database connection
const CLOUD_MONGODB_URI = 'mongodb+srv://Kachianietie:Dabonega$reus2660@cluster0.1mos0xn.mongodb.net/cbt_database?retryWrites=true&w=majority&appName=Cluster0';

// Path to the exported data file
const EXPORT_FILE_PATH = path.join(__dirname, '..', '761d46e2a5f95ceb67b9a78d8570796ecee1e081e0d05ae2e468ac6691d2b429');
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

async function extractAndRestore() {
  console.log('🚀 Extracting and Restoring Data...\n');
  
  // Check if export file exists
  if (!fs.existsSync(EXPORT_FILE_PATH)) {
    console.error('❌ Export file not found:', EXPORT_FILE_PATH);
    return;
  }
  
  console.log('📁 Found export file:', path.basename(EXPORT_FILE_PATH));
  console.log('📊 File size:', (fs.statSync(EXPORT_FILE_PATH).size / 1024).toFixed(2), 'KB');
  
  try {
    // Create extract directory
    if (!fs.existsSync(EXTRACT_DIR)) {
      fs.mkdirSync(EXTRACT_DIR);
    }
    
    // Extract ZIP file
    console.log('\n📦 Extracting ZIP file...');
    try {
      await execAsync(`powershell -command "Expand-Archive -Path '${EXPORT_FILE_PATH}' -DestinationPath '${EXTRACT_DIR}' -Force"`);
      console.log('✅ ZIP file extracted successfully');
    } catch (extractError) {
      console.log('❌ PowerShell extraction failed, trying alternative method...');
      // Try using 7-Zip if available
      try {
        await execAsync(`"C:\\Program Files\\7-Zip\\7z.exe" x "${EXPORT_FILE_PATH}" -o"${EXTRACT_DIR}" -y`);
        console.log('✅ ZIP file extracted using 7-Zip');
      } catch (sevenZipError) {
        console.log('❌ 7-Zip extraction failed');
        console.log('Please extract the ZIP file manually and place the contents in:', EXTRACT_DIR);
        return;
      }
    }
    
    // List extracted files
    console.log('\n📋 Extracted files:');
    const files = fs.readdirSync(EXTRACT_DIR);
    files.forEach(file => {
      console.log(`- ${file}`);
    });
    
    // Look for JSON files
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    if (jsonFiles.length === 0) {
      console.log('\n❌ No JSON files found in extraction');
      console.log('Please check the extracted contents manually');
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
    
    // Process each JSON file
    for (const jsonFile of jsonFiles) {
      console.log(`\n📖 Processing: ${jsonFile}`);
      const filePath = path.join(EXTRACT_DIR, jsonFile);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      try {
        const data = JSON.parse(fileContent);
        
        // Determine what type of data this is
        if (data.users || data.length > 0 && data[0].username) {
          console.log('👥 Found user data');
          if (Array.isArray(data)) {
            await User.insertMany(data);
            console.log(`✅ Restored ${data.length} users`);
          } else if (data.users) {
            await User.insertMany(data.users);
            console.log(`✅ Restored ${data.users.length} users`);
          }
        }
        
        if (data.exams || data.length > 0 && data[0].title) {
          console.log('📝 Found exam data');
          if (Array.isArray(data)) {
            await Exam.insertMany(data);
            console.log(`✅ Restored ${data.length} exams`);
          } else if (data.exams) {
            await Exam.insertMany(data.exams);
            console.log(`✅ Restored ${data.exams.length} exams`);
          }
        }
        
        if (data.results || data.length > 0 && data[0].score !== undefined) {
          console.log('📊 Found result data');
          if (Array.isArray(data)) {
            await Result.insertMany(data);
            console.log(`✅ Restored ${data.length} results`);
          } else if (data.results) {
            await Result.insertMany(data.results);
            console.log(`✅ Restored ${data.results.length} results`);
          }
        }
        
      } catch (parseError) {
        console.log(`❌ Error parsing ${jsonFile}:`, parseError.message);
      }
    }
    
    console.log('\n🎉 Data restoration completed successfully!');
    
    // Clean up
    console.log('\n🧹 Cleaning up extracted files...');
    fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
    console.log('✅ Cleanup completed');
    
    await connection.disconnect();
    console.log('🔌 Disconnected from cloud database');
    
  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  }
}

// Run extraction and restoration
extractAndRestore(); 