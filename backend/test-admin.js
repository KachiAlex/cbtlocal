const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cbt');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test default admin user creation
const testDefaultAdminCreation = async () => {
  try {
    const User = require('./src/models/User');
    
    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Username:', existingAdmin.username);
      console.log('Role:', existingAdmin.role);
      console.log('Full Name:', existingAdmin.fullName);
      console.log('Is Default Admin:', existingAdmin.isDefaultAdmin);
      return existingAdmin;
    }
    
    // Create default admin user
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      fullName: 'System Administrator',
      email: 'admin@healthschool.com',
      createdAt: new Date(),
      isDefaultAdmin: true,
      canDeleteDefaultAdmin: true
    });
    
    await adminUser.save();
    console.log('✅ Default admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('Is Default Admin: true');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creating default admin user:', error);
    return null;
  }
};

// Test authentication
const testAuthentication = async () => {
  try {
    const User = require('./src/models/User');
    
    // Test admin login
    const user = await User.findOne({ 
      username: { $regex: /^admin$/i },
      password: 'admin123'
    });
    
    if (user) {
      console.log('✅ Authentication test passed');
      console.log('User found:', user.username, user.role);
      console.log('Is Default Admin:', user.isDefaultAdmin);
    } else {
      console.log('❌ Authentication test failed');
    }
    
  } catch (error) {
    console.error('❌ Error testing authentication:', error);
  }
};

// Test admin hierarchy
const testAdminHierarchy = async () => {
  try {
    const User = require('./src/models/User');
    
    // Test creating a new admin user (simulating API call)
    const newAdmin = new User({
      username: 'testadmin',
      password: 'testpass123',
      role: 'admin',
      fullName: 'Test Administrator',
      email: 'testadmin@healthschool.com',
      createdAt: new Date(),
      isDefaultAdmin: false,
      createdBy: 'admin',
      canDeleteDefaultAdmin: false
    });
    
    await newAdmin.save();
    console.log('✅ Test admin user created successfully');
    console.log('Username: testadmin');
    console.log('Created by: admin');
    console.log('Is Default Admin: false');
    
    // List all admin users
    const allAdmins = await User.find({ role: 'admin' }).select('-password');
    console.log('\n📋 All Admin Users:');
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.fullName} (${admin.username})`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Default Admin: ${admin.isDefaultAdmin ? 'Yes' : 'No'}`);
      console.log(`   Created by: ${admin.createdBy || 'System'}`);
      console.log('');
    });
    
    // Clean up test admin
    await User.findByIdAndDelete(newAdmin._id);
    console.log('✅ Test admin user cleaned up');
    
  } catch (error) {
    console.error('❌ Error testing admin hierarchy:', error);
  }
};

// Run tests
const runTests = async () => {
  console.log('🧪 Testing CBT Hierarchical Admin System...\n');
  
  await connectDB();
  await testDefaultAdminCreation();
  await testAuthentication();
  await testAdminHierarchy();
  
  console.log('\n✅ All tests completed');
  process.exit(0);
};

runTests(); 