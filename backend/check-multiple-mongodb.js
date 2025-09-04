const mongoose = require('mongoose');

async function checkMultipleMongoDB() {
  console.log('🔍 Checking Multiple MongoDB Instances...\n');
  
  // Common MongoDB ports and connections to check
  const connections = [
    { name: 'Default MongoDB (27017)', uri: 'mongodb://localhost:27017/' },
    { name: 'MongoDB Alt Port (27018)', uri: 'mongodb://localhost:27018/' },
    { name: 'MongoDB Alt Port (27019)', uri: 'mongodb://localhost:27019/' },
    { name: 'MongoDB with Auth', uri: 'mongodb://localhost:27017/admin' },
  ];
  
  for (const conn of connections) {
    console.log(`\n📡 Testing: ${conn.name}`);
    console.log(`   URI: ${conn.uri}`);
    
    try {
      const connection = await mongoose.createConnection(conn.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // 5 second timeout
      });
      
      const adminDb = connection.db.admin();
      const dbInfo = await adminDb.listDatabases();
      
      console.log(`   ✅ Connected successfully`);
      console.log(`   📊 Found ${dbInfo.databases.length} databases`);
      
      // Show non-system databases
      const userDatabases = dbInfo.databases.filter(db => 
        !['admin', 'local', 'config'].includes(db.name)
      );
      
      if (userDatabases.length > 0) {
        console.log(`   🗄️ User databases:`);
        userDatabases.forEach(db => {
          console.log(`      - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });
      } else {
        console.log(`   ℹ️ No user databases found`);
      }
      
      await connection.close();
      
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
    }
  }
  
  console.log('\n🔍 Also checking for other data sources...');
  console.log('📁 Look for these files in your project:');
  console.log('- *.db (SQLite databases)');
  console.log('- *.sqlite (SQLite databases)');
  console.log('- data.json (JSON data files)');
  console.log('- *.csv (CSV data files)');
  console.log('- *.bson (MongoDB dumps)');
  console.log('- *.gz (Compressed dumps)');
}

checkMultipleMongoDB(); 