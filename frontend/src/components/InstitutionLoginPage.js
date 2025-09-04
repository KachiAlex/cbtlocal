import React, { useState, useEffect } from "react";
import dataService from "../services/dataService";

// CBT System Components
import CBTAdminPanel from "./CBTAdminPanel";
import CBTStudentPortal from "./CBTStudentPortal";
import CBTHeader from "./CBTHeader";

const InstitutionLoginPage = () => {
  const [institutionData, setInstitutionData] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login"); // "login", "admin-panel", "student-portal"
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    loadInstitutionData();
  }, []);

  const loadInstitutionData = async () => {
    try {
      // First check if data is already loaded in localStorage by App.js
      const savedInstitutionData = localStorage.getItem('institution_data');
      const savedSlug = localStorage.getItem('institution_slug');
      
      if (savedInstitutionData && savedSlug) {
        const data = JSON.parse(savedInstitutionData);
        console.log('🏫 Institution data loaded from localStorage:', data);
        setInstitutionData(data);
        
        // Check if user is already logged in
        const savedUser = localStorage.getItem("cbt_logged_in_user");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          const isAdminEquivalent = ['admin','super_admin','managed_admin','tenant_admin'].includes(userData.role);
          setView(isAdminEquivalent ? "admin-panel" : "student-portal");
        }
        
        setLoading(false);
        return;
      }

      // Fallback: Get institution slug from URL and load data
      const urlParams = new URLSearchParams(window.location.search);
      const slug = urlParams.get('slug');

      if (!slug) {
        setError("No institution specified");
        setLoading(false);
        return;
      }

      // Load institution data from MongoDB API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`https://cbt-rew7.onrender.com/api/tenant/${slug}/profile`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Institution not found or suspended');
        }

        const data = await response.json();
        console.log('🏫 Institution data loaded from API:', data);
        console.log('🔍 Slug field:', data.slug);
        console.log('🔍 All fields:', Object.keys(data));
        setInstitutionData(data);
        
        // Store institution data in localStorage for use throughout the CBT system
        localStorage.setItem('institution_data', JSON.stringify(data));
        localStorage.setItem('institution_slug', slug);
        
        // Check if user is already logged in
        const savedUser = localStorage.getItem("cbt_logged_in_user");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          const isAdminEquivalent = ['admin','super_admin','managed_admin','tenant_admin'].includes(userData.role);
          setView(isAdminEquivalent ? "admin-panel" : "student-portal");
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw fetchError;
      }
      
    } catch (error) {
      console.error('Failed to load institution data:', error);
      setError('Institution not found or suspended');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (username, password, role) => {
    try {
      setAuthError("");
      
      // Use dataService to authenticate user with institution context
      console.log('🔍 Institution data for authentication:', institutionData);
      console.log('🔍 Institution slug being passed:', institutionData?.slug);
      
      const user = await dataService.authenticateUser(username, password, institutionData?.slug);
      
      console.log('🔍 Login attempt:', { username, role, user });
      
      const isAdminRoleAccepted = user && ['admin', 'super_admin', 'managed_admin', 'tenant_admin'].includes(user.role);
      const roleIsValid = role === 'admin' ? isAdminRoleAccepted : (user && user.role === role);
      
      if (roleIsValid) {
        // Store user data with institution context
        const userWithInstitution = {
          ...user,
          institutionSlug: institutionData?.slug || null,
          institutionName: institutionData?.name || null
        };
        
        console.log('✅ Login successful:', userWithInstitution);
        
        setUser(userWithInstitution);
        localStorage.setItem("cbt_logged_in_user", JSON.stringify(userWithInstitution));
        
        // Redirect based on role requested
        if (role === "admin") {
          setView("admin-panel");
        } else {
          setView("student-portal");
        }
      } else {
        console.log('❌ Role mismatch:', { expectedRole: role, actualRole: user?.role, user });
        if (!user) {
          setAuthError(`Authentication failed. Please check your username and password.`);
        } else {
          setAuthError(`Invalid ${role} credentials. User role is '${user.role}', but '${role}' is required.`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      // Show the specific error message inline for authentication failures
      if (error.message && error.message !== 'Invalid credentials') {
        setAuthError(error.message);
      } else {
        setAuthError("Login failed. Please try again.");
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("cbt_logged_in_user");
    setView("login");
    setAuthError("");
  };

  // Hidden admin access - click on the logo
  const handleLogoClick = () => {
    if (!user) {
      setShowAdminLogin(!showAdminLogin);
      setAuthError("");
    }
  };

  // Keyboard shortcut for admin access (Ctrl + Alt + A)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!user && e.ctrlKey && e.altKey && e.key === 'A') {
    e.preventDefault();
        setShowAdminLogin(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [user]);

  const handleStudentRegistration = async (studentData) => {
    try {
      setError("");
      
      // Use dataService to register student with tenant slug
      const newStudent = await dataService.registerStudent(studentData, institutionData.slug);
      
      if (newStudent) {
        // Auto-login the new student
        setUser(newStudent);
        localStorage.setItem("cbt_logged_in_user", JSON.stringify(newStudent));
        setView("student-portal");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading institution...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Please contact your administrator or check the institution URL.</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show appropriate CBT interface
  if (user) {
    if (view === "admin-panel") {
  return (
        <div className="min-h-screen bg-gray-50">
          <CBTHeader 
            user={user} 
            institution={institutionData} 
            onLogout={handleLogout}
            onSwitchToStudent={() => setView("student-portal")}
          />
          <CBTAdminPanel 
            user={user} 
            institution={institutionData}
            onLogout={handleLogout}
              />
            </div>
      );
    }

    if (view === "student-portal") {
      return (
        <div className="min-h-screen bg-gray-50">
          <CBTHeader 
            user={user} 
            institution={institutionData} 
            onLogout={handleLogout}
            onSwitchToAdmin={() => setView("admin-panel")}
          />
          <CBTStudentPortal 
            user={user} 
            institution={institutionData}
            onLogout={handleLogout}
          />
              </div>
      );
    }
  }

  // Show login/registration interface
  return (
    <div className="min-h-screen bg-gray-50">
      <CBTHeader 
        user={null} 
        institution={institutionData} 
        onLogout={handleLogout}
        onLogoClick={handleLogoClick}
      />
      
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-8 py-4 sm:py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Computer-Based Testing Portal
          </h1>
          <p className="text-gray-600">Welcome to your institution's testing platform</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {showAdminLogin ? (
            /* Admin Login */
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-center flex-1">🔐 Admin Access</h2>
                <button
                  onClick={() => setShowAdminLogin(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                  title="Back to student portal"
                >
                  ×
                </button>
              </div>
              {authError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {authError}
                </div>
              )}
              <AdminLoginForm onLogin={(u, p) => handleLogin(u, p, "admin")} />
              <div className="text-xs text-gray-500 text-center mt-4">
                <p>Default admin: username: admin | password: admin123</p>
              </div>
            </div>
          ) : (
            /* Student Portal */
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-center">👨‍🎓 Student Portal</h2>
              {authError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
                  {authError}
                </div>
              )}
              <StudentPortalForm 
                onLogin={(u, p) => handleLogin(u, p, "student")}
                onRegister={handleStudentRegistration}
              />
              <div className="text-xs text-gray-500 text-center mt-4">
                <p>💡 <strong>Tip:</strong> Click on the CBT logo above for admin access</p>
              </div>
            </div>
          )}
        </div>
      </main>
              </div>
  );
};

// Admin Login Form Component
function AdminLoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setIsLoading(true);
    onLogin(username, password);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter admin username"
                      required
                    />
                  </div>
                  
                  <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter admin password"
                        required
        />
                  </div>

                    <button 
                      type="submit" 
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
      >
        {isLoading ? "Signing In..." : "Sign In as Admin"}
      </button>
    </form>
  );
}

// Student Portal Form Component
function StudentPortalForm({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      if (!formData.username || !formData.password) return;
      setIsLoading(true);
      onLogin(formData.username, formData.password);
      setIsLoading(false);
    } else {
      if (!formData.username || !formData.password || !formData.fullName || !formData.email) return;
      if (formData.password !== formData.confirmPassword) return;
      
      setIsLoading(true);
      onRegister(formData);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex mb-4">
        <button 
          onClick={() => {setMode("login"); setFormData({...formData, password: "", confirmPassword: ""});}} 
          className={`flex-1 py-2 text-sm font-medium ${mode === "login" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500"}`}
        >
          Login
                    </button>
                    <button 
          onClick={() => {setMode("register"); setFormData({...formData, password: "", confirmPassword: ""});}} 
          className={`flex-1 py-2 text-sm font-medium ${mode === "register" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500"}`}
                    >
          Register
                    </button>
                  </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </>
        )}
        
                  <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{mode === "login" ? "Username or Email" : "Username"}</label>
                    <input
                      type="text"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder={mode === "login" ? "Enter your username or email" : "Choose a username"}
                      required
                    />
                  </div>
                  
                  <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder={mode === "login" ? "Enter your password" : "Choose a password"}
                        required
          />
                  </div>

        {mode === "register" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Confirm your password"
              required
            />
          </div>
        )}
        
                    <button 
                      type="submit" 
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-lg font-medium disabled:opacity-50 ${
            mode === "login" 
              ? "bg-emerald-600 text-white hover:bg-emerald-700" 
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isLoading ? "Processing..." : (mode === "login" ? "Login as Student" : "Register as Student")}
                    </button>
                </form>
    </div>
  );
}

export default InstitutionLoginPage;
