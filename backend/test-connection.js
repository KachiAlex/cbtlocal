// Test script to verify backend connection
const axios = require('axios');

const BACKEND_URL = 'https://cbt-rew7.onrender.com';

async function testBackend() {
  console.log('🔍 Testing CBT Backend Connection...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test API info endpoint
    console.log('\n2. Testing API info endpoint...');
    const apiResponse = await axios.get(`${BACKEND_URL}/api`);
    console.log('✅ API info:', apiResponse.data);
    
    console.log('\n🎉 Backend is working correctly!');
    console.log('📝 Next step: Set up MongoDB Atlas database');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if backend is deployed on Render');
    console.log('2. Check Render deployment logs');
    console.log('3. Verify the backend URL is correct');
  }
}

testBackend(); 