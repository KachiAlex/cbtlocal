const mongoose = require('mongoose');

// Local database connection
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/cbt_database';

async function checkLocalDatabase() {
  console.log('🔍 Checking Local Database...\n');
  
  let connection;
  
  try {
    // Connect to local database
    console.log('📡 Connecting to local database...');
    connection = await mongoose.connect(LOCAL_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to local database\n');
    
    // Get database instance
    const db = connection.connection.db;
    
    // List all collections
    console.log('📋 Available Collections:');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('❌ No collections found in the database');
      return;
    }
    
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    console.log('\n📊 Collection Details:');
    
    // Check each collection for data
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      
      console.log(`\n📁 Collection: ${collectionName}`);
      console.log(`   Documents: ${count}`);
      
      if (count > 0) {
        // Show sample documents
        const sampleDocs = await db.collection(collectionName).find({}).limit(2).toArray();
        console.log(`   Sample documents:`);
        sampleDocs.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${JSON.stringify(doc, null, 2)}`);
        });
      }
    }
    
    // Check if database exists
    console.log('\n🗄️ Database Information:');
    const adminDb = connection.connection.db.admin();
    const dbInfo = await adminDb.listDatabases();
    const currentDb = dbInfo.databases.find(db => db.name === 'cbt_database');
    
    if (currentDb) {
      console.log(`✅ Database 'cbt_database' exists`);
      console.log(`   Size: ${(currentDb.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log('❌ Database "cbt_database" not found');
      console.log('Available databases:');
      dbInfo.databases.forEach(db => {
        console.log(`- ${db.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is running: mongod');
    console.log('2. Check if the database name is correct');
    console.log('3. Verify the connection string');
  } finally {
    if (connection) {
      await connection.disconnect();
      console.log('\n🔌 Disconnected from database');
    }
  }
}

// Run the check
checkLocalDatabase(); 