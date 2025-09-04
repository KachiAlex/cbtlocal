const mongoose = require('mongoose');

// Local MongoDB connection (without specifying database)
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/';

async function checkAllDatabases() {
  console.log('🔍 Checking All Local Databases...\n');
  
  let connection;
  
  try {
    // Connect to MongoDB without specifying database
    console.log('📡 Connecting to MongoDB...');
    connection = await mongoose.connect(LOCAL_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Get admin database
    const adminDb = connection.connection.db.admin();
    
    // List all databases
    console.log('🗄️ All Databases:');
    const dbInfo = await adminDb.listDatabases();
    
    if (dbInfo.databases.length === 0) {
      console.log('❌ No databases found');
      return;
    }
    
    // Check each database
    for (const db of dbInfo.databases) {
      if (db.name === 'admin' || db.name === 'local' || db.name === 'config') {
        continue; // Skip system databases
      }
      
      console.log(`\n📊 Database: ${db.name}`);
      console.log(`   Size: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      
      // Connect to this specific database
      const dbConnection = await mongoose.createConnection(`mongodb://localhost:27017/${db.name}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      try {
        // List collections in this database
        const collections = await dbConnection.db.listCollections().toArray();
        
        if (collections.length === 0) {
          console.log(`   Collections: None`);
        } else {
          console.log(`   Collections:`);
          
          for (const collection of collections) {
            const count = await dbConnection.db.collection(collection.name).countDocuments();
            console.log(`     - ${collection.name}: ${count} documents`);
            
            // If collection has data, show sample
            if (count > 0) {
              const sample = await dbConnection.db.collection(collection.name).find({}).limit(1).toArray();
              if (sample.length > 0) {
                console.log(`       Sample: ${JSON.stringify(sample[0], null, 2).substring(0, 200)}...`);
              }
            }
          }
        }
      } finally {
        await dbConnection.close();
      }
    }
    
    // Also check if there are any data files in the project
    console.log('\n📁 Checking for data files in project...');
    console.log('Look for files like:');
    console.log('- *.json (data exports)');
    console.log('- *.bson (MongoDB dumps)');
    console.log('- *.csv (data exports)');
    
  } catch (error) {
    console.error('❌ Error checking databases:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is running: mongod');
    console.log('2. Check if MongoDB is running on a different port');
    console.log('3. Check if you have multiple MongoDB instances');
  } finally {
    if (connection) {
      await connection.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run the check
checkAllDatabases(); 