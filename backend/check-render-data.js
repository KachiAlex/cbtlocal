const axios = require('axios');

const RENDER_BACKEND_URL = 'https://cbt-rew7.onrender.com';

async function checkRenderData() {
  console.log('🔍 Checking Render Backend Data...\n');
  
  try {
    // Check health endpoint
    console.log('📡 Checking backend health...');
    const healthResponse = await axios.get(`${RENDER_BACKEND_URL}/health`);
    console.log('✅ Backend is healthy:', healthResponse.data);
    
    // Try to get users
    console.log('\n👥 Checking for users...');
    try {
      const usersResponse = await axios.get(`${RENDER_BACKEND_URL}/api/users`);
      console.log(`✅ Found ${usersResponse.data.length} users in deployed backend`);
      if (usersResponse.data.length > 0) {
        console.log('Sample users:');
        usersResponse.data.slice(0, 3).forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.username} (${user.email})`);
        });
      }
    } catch (error) {
      console.log('❌ Could not fetch users:', error.message);
    }
    
    // Try to get exams
    console.log('\n📝 Checking for exams...');
    try {
      const examsResponse = await axios.get(`${RENDER_BACKEND_URL}/api/exams`);
      console.log(`✅ Found ${examsResponse.data.length} exams in deployed backend`);
      if (examsResponse.data.length > 0) {
        console.log('Sample exams:');
        examsResponse.data.slice(0, 3).forEach((exam, index) => {
          console.log(`  ${index + 1}. ${exam.title}`);
        });
      }
    } catch (error) {
      console.log('❌ Could not fetch exams:', error.message);
    }
    
    // Try to get results
    console.log('\n📊 Checking for results...');
    try {
      const resultsResponse = await axios.get(`${RENDER_BACKEND_URL}/api/results`);
      console.log(`✅ Found ${resultsResponse.data.length} results in deployed backend`);
    } catch (error) {
      console.log('❌ Could not fetch results:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking Render backend:', error.message);
  }
}

checkRenderData(); 