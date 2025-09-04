

// Configuration - Cloud Database Enabled (but with localStorage fallback for admin)
const USE_API = process.env.REACT_APP_USE_API === 'true' || process.env.NODE_ENV === 'production';
const API_BASE = process.env.REACT_APP_API_URL || 'https://cbt-rew7.onrender.com';

// LocalStorage keys
const LS_KEYS = {
  EXAMS: "cbt_exams_v1",
  QUESTIONS: "cbt_questions_v1", 
  RESULTS: "cbt_results_v1",
  USERS: "cbt_users_v1",
  STUDENT_REGISTRATIONS: "cbt_student_registrations_v1"
};

// Default admin user (referenced in comments)
// username: "admin"
// password: "admin123"
// role: "admin"
// fullName: "System Administrator"
// email: "admin@healthschool.com"



// Helper functions for localStorage
const getFromLS = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const setToLS = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
};

// Initialize localStorage with fallback data if empty
const initializeLocalStorage = () => {
  // Completely disabled fallback data initialization
  // This ensures a truly clean start when database is cleared
  console.log('🚫 Fallback data initialization disabled - keeping localStorage clean');
};

// API wrapper with fallback to localStorage
const apiCall = async (endpoint, options = {}) => {
  if (!USE_API) {
    console.log('Using localStorage fallback for:', endpoint);
    return null; // Will trigger localStorage fallback
  }

  try {
    console.log(`🌐 Making API call to: ${API_BASE}${endpoint}`);
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API call successful: ${endpoint}`);
    return data;
  } catch (error) {
    console.warn(`❌ API call failed for ${endpoint}, falling back to localStorage:`, error.message);
    return null; // Will trigger localStorage fallback
  }
};

// Data service functions
export const dataService = {
  // User management
  loadUsers: async () => {
    initializeLocalStorage(); // Ensure data exists
    const apiData = await apiCall('/api/users');
    
    if (apiData) {
      // Check if any admin exists in cloud data
      const adminExists = apiData.some(user => user.role === 'admin');
      if (!adminExists && USE_API) {
        // Try to initialize default admin user in cloud database
        try {
          const response = await fetch(`${API_BASE}/api/init-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            const result = await response.json();
            if (!result.exists) {
              console.log('👤 Default admin user created in cloud database');
              // Reload users to get the newly created admin
              const updatedApiData = await apiCall('/api/users');
              return updatedApiData || apiData;
            }
          }
        } catch (error) {
          console.warn('Failed to initialize admin in cloud database:', error.message);
        }
      }
      return apiData;
    }

    // Fallback to localStorage
    const saved = getFromLS(LS_KEYS.USERS);
    let users = saved || [];
    
    // Check if any admin exists in localStorage
    const adminExists = users.some(user => user.role === 'admin');
    if (!adminExists) {
      const defaultAdmin = {
        username: "admin",
        password: "admin123",
        role: "admin",
        fullName: "System Administrator",
        email: "admin@healthschool.com",
        createdAt: new Date().toISOString(),
        isDefaultAdmin: true,
        canDeleteDefaultAdmin: true
      };
      users.push(defaultAdmin);
      setToLS(LS_KEYS.USERS, users);
      console.log('👤 Default admin user created in localStorage (fallback)');
    }
    
    return users;
  },

  saveUsers: async (users) => {
    // Try API first, fallback to localStorage
    if (USE_API) {
      try {
        const response = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(users)
        });
        if (response.ok) {
          console.log('✅ Users saved to cloud database');
          return true;
        }
      } catch (error) {
        console.warn('Failed to save users to API, using localStorage:', error.message);
      }
    }
    return setToLS(LS_KEYS.USERS, users);
  },

  // Exam management
  loadExams: async () => {
    initializeLocalStorage(); // Ensure data exists
    const apiData = await apiCall('/api/exams');
    if (apiData) return apiData;

    // Fallback to localStorage
    const saved = getFromLS(LS_KEYS.EXAMS);
    return saved || [];
  },

  saveExams: async (exams) => {
    // Try API first, fallback to localStorage
    if (USE_API) {
      try {
        const response = await fetch(`${API_BASE}/api/exams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exams)
        });
        if (response.ok) {
          console.log('✅ Exams saved to cloud database');
          return true;
        }
      } catch (error) {
        console.warn('Failed to save exams to API, using localStorage:', error.message);
      }
    }
    return setToLS(LS_KEYS.EXAMS, exams);
  },

  // Questions management
  loadQuestions: async () => {
    initializeLocalStorage(); // Ensure data exists
    const apiData = await apiCall('/api/questions');
    if (apiData) return apiData;

    // Fallback to localStorage
    const saved = getFromLS(LS_KEYS.QUESTIONS);
    return saved || [];
  },

  saveQuestions: async (questions) => {
    // Try API first, fallback to localStorage
    if (USE_API) {
      try {
        const response = await fetch(`${API_BASE}/api/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questions)
        });
        if (response.ok) {
          console.log('✅ Questions saved to cloud database');
          return true;
        }
      } catch (error) {
        console.warn('Failed to save questions to API, using localStorage:', error.message);
      }
    }
    return setToLS(LS_KEYS.QUESTIONS, questions);
  },

  // Results management
  loadResults: async () => {
    initializeLocalStorage(); // Ensure data exists
    const apiData = await apiCall('/api/results');
    if (apiData) return apiData;

    // Fallback to localStorage
    const saved = getFromLS(LS_KEYS.RESULTS);
    return saved || [];
  },

  saveResults: async (results) => {
    // Try API first, fallback to localStorage
    if (USE_API) {
      try {
        const response = await fetch(`${API_BASE}/api/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(results)
        });
        if (response.ok) {
          console.log('✅ Results saved to cloud database');
          return true;
        }
      } catch (error) {
        console.warn('Failed to save results to API, using localStorage:', error.message);
      }
    }
    return setToLS(LS_KEYS.RESULTS, results);
  },

  // Student registrations
  loadStudentRegistrations: async () => {
    // This is typically only stored locally
    const saved = getFromLS(LS_KEYS.STUDENT_REGISTRATIONS);
    return saved || [];
  },

  saveStudentRegistrations: async (registrations) => {
    return setToLS(LS_KEYS.STUDENT_REGISTRATIONS, registrations);
  },

  // Authentication
  authenticateUser: async (username, password) => {
    // Try API authentication first
    if (USE_API) {
      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password })
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ User authenticated via API');
          return userData;
        } else {
          console.warn('API authentication failed, falling back to localStorage');
        }
      } catch (error) {
        console.warn('API authentication error, falling back to localStorage:', error.message);
      }
    }

    // Fallback to localStorage authentication
    try {
      const users = await dataService.loadUsers();
      const normalized = (username || "").trim().toLowerCase();
      const user = users.find(u => (u.username || "").toLowerCase() === normalized);
      
      if (!user) return null;
      if (user.password !== password) return null;
      
      console.log('✅ User authenticated via localStorage');
      return { 
        username: user.username, 
        role: user.role, 
        fullName: user.fullName, 
        email: user.email 
      };
    } catch (error) {
      console.error('LocalStorage authentication error:', error);
      return null;
    }
  },

  // Utility functions
  createExam: async (examData) => {
    const exams = await dataService.loadExams();
    const newExam = {
      id: crypto.randomUUID(),
      ...examData,
      createdAt: new Date().toISOString(),
      isActive: false
    };
    exams.push(newExam);
    await dataService.saveExams(exams);
    return newExam;
  },

  // Active exam management
  getActiveExam: () => {
    const saved = getFromLS(LS_KEYS.ACTIVE_EXAM);
    return saved || null;
  },

  setActiveExam: (examId) => {
    return setToLS(LS_KEYS.ACTIVE_EXAM, examId);
  },

  clearActiveExam: () => {
    localStorage.removeItem(LS_KEYS.ACTIVE_EXAM);
  },

  updateExam: async (examId, updates) => {
    const exams = await dataService.loadExams();
    const updatedExams = exams.map(exam => 
      exam.id === examId ? { ...exam, ...updates } : exam
    );
    await dataService.saveExams(updatedExams);
  },

  deleteExam: async (examId) => {
    const exams = await dataService.loadExams();
    const filteredExams = exams.filter(exam => exam.id !== examId);
    await dataService.saveExams(filteredExams);
  },

  // Health check
  healthCheck: async () => {
    try {
      console.log('🔍 Checking API health...');
      const response = await fetch(`${API_BASE}/health`);
      const isHealthy = response.ok;
      console.log(`API health check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      return isHealthy;
    } catch (error) {
      console.log('❌ API health check failed:', error.message);
      return false;
    }
  },

  // Check API connection and configuration
  checkApiConnection: async () => {
    try {
      console.log('🔍 Checking API connection...');
      console.log('API Base URL:', API_BASE);
      console.log('USE_API setting:', USE_API);
      
      if (!USE_API) {
        console.log('ℹ️ API is disabled, using localStorage only');
        return { connected: false, reason: 'API disabled' };
      }
      
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const healthData = await response.json();
        console.log('✅ API connection successful:', healthData);
        return { connected: true, data: healthData };
      } else {
        console.log('❌ API health check failed:', response.status, response.statusText);
        return { connected: false, reason: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.log('❌ API connection error:', error.message);
      return { connected: false, reason: error.message };
    }
  },

  // Manual admin user creation for testing
  createAdminUser: () => {
    const defaultAdmin = {
      username: "admin",
      password: "admin123",
      role: "admin",
      fullName: "System Administrator",
      email: "admin@healthschool.com",
      createdAt: new Date().toISOString(),
      isDefaultAdmin: true,
      canDeleteDefaultAdmin: true
    };
    
    const saved = getFromLS(LS_KEYS.USERS);
    let users = saved || [];
    
    // Check if admin already exists
    const adminExists = users.some(user => user.role === 'admin');
    if (!adminExists) {
      users.push(defaultAdmin);
      setToLS(LS_KEYS.USERS, users);
      console.log('👤 Admin user manually created in localStorage');
      return true;
    } else {
      console.log('👤 Admin user already exists');
      return false;
    }
  },

  // Admin management functions
  createNewAdmin: async (adminData, requestingAdmin) => {
    if (USE_API) {
      try {
        const response = await fetch(`${API_BASE}/api/admin/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...adminData, requestingAdmin })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ New admin created via API');
          return result;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create admin');
        }
      } catch (error) {
        console.warn('API admin creation failed, falling back to localStorage:', error.message);
        throw error;
      }
    }

    // Fallback to localStorage
    const users = await dataService.loadUsers();
    const newAdmin = {
      ...adminData,
      role: 'admin',
      createdAt: new Date().toISOString(),
      isDefaultAdmin: false,
      createdBy: requestingAdmin,
      canDeleteDefaultAdmin: false
    };
    
    users.push(newAdmin);
    await dataService.saveUsers(users);
    console.log('✅ New admin created in localStorage');
    return { user: newAdmin };
  },

  listAdminUsers: async (requestingAdmin) => {
    if (USE_API) {
      try {
        const response = await fetch(`${API_BASE}/api/admin/list?requestingAdmin=${encodeURIComponent(requestingAdmin)}`);
        
        if (response.ok) {
          const admins = await response.json();
          console.log('✅ Admin list retrieved via API');
          return admins;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to get admin list');
        }
      } catch (error) {
        console.warn('API admin list failed, falling back to localStorage:', error.message);
        throw error;
      }
    }

    // Fallback to localStorage
    const users = await dataService.loadUsers();
    const admins = users.filter(user => user.role === 'admin');
    console.log('✅ Admin list retrieved from localStorage');
    return admins;
  },

  deleteAdminUser: async (username, requestingAdmin) => {
    if (USE_API) {
      try {
        const response = await fetch(`${API_BASE}/api/admin/${encodeURIComponent(username)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestingAdmin })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Admin deleted via API');
          return result;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete admin');
        }
      } catch (error) {
        console.warn('API admin deletion failed, falling back to localStorage:', error.message);
        throw error;
      }
    }

    // Fallback to localStorage
    const users = await dataService.loadUsers();
    const filteredUsers = users.filter(user => 
      !(user.username.toLowerCase() === username.toLowerCase() && user.role === 'admin')
    );
    
    if (filteredUsers.length === users.length) {
      throw new Error('Admin user not found');
    }
    
    await dataService.saveUsers(filteredUsers);
    console.log('✅ Admin deleted from localStorage');
    return { message: 'Admin user deleted successfully' };
  }
};

export default dataService; 