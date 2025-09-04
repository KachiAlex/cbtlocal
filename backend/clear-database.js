const mongoose = require('mongoose');

const CLOUD_MONGODB_URI = 'mongodb+srv://Kachianietie:Dabonega$reus2660@cluster0.1mos0xn.mongodb.net/cbt_database?retryWrites=true&w=majority&appName=Cluster0';

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(CLOUD_MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get the database
    const db = mongoose.connection.db;
    
    console.log('\n🗑️ Clearing all collections...');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections:`, collections.map(c => c.name));
    
    // Clear each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🧹 Clearing collection: ${collectionName}`);
      
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} documents from ${collectionName}`);
    }
    
    console.log('\n🎉 Database cleared successfully!');
    console.log('📊 All collections are now empty.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

// Run the script
clearDatabase(); 