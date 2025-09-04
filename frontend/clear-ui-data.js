// Script to clear all localStorage data and reset the UI
console.log('🧹 Clearing all CBT localStorage data...');

// Clear all CBT-related localStorage items
const LS_KEYS = {
  EXAMS: "cbt_exams_v1",
  QUESTIONS: "cbt_questions_v1", 
  RESULTS: "cbt_results_v1",
  USERS: "cbt_users_v1",
  STUDENT_REGISTRATIONS: "cbt_student_registrations_v1",
  SHARED_DATA: "cbt_shared_data_v1",
  ACTIVE_EXAM: "cbt_active_exam_v1"
};

// Clear all CBT-related localStorage items
Object.values(LS_KEYS).forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Cleared: ${key}`);
});

// Also clear any exam-specific question storage
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('cbt_questions_')) {
    localStorage.removeItem(key);
    console.log(`✅ Cleared exam questions: ${key}`);
  }
}

// Clear logged in user
localStorage.removeItem('cbt_logged_in_user');
console.log('✅ Cleared logged in user');

console.log('🎉 All CBT localStorage data cleared!');
console.log('📊 Remaining localStorage items:', localStorage.length);

// Instructions for the user
console.log('\n📋 Next steps:');
console.log('1. Refresh the page (F5 or Ctrl+R)');
console.log('2. The UI should now show empty lists');
console.log('3. You can start fresh with a clean application'); 