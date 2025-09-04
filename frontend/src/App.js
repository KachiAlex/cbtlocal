import React, { useEffect, useState } from "react";
import InstitutionLoginPage from "./components/InstitutionLoginPage";
import MultiTenantAdmin from "./components/MultiTenantAdmin";
import MultiTenantAdminLogin from "./components/MultiTenantAdminLogin";
import CBTExam from "./components/CBTExam";
import StudentExam from "./components/StudentExam";
import dataService from "./services/dataService";

const LS_KEYS = {
  EXAMS: "cbt_exams_v1",
  QUESTIONS: "cbt_questions_v1",
  RESULTS: "cbt_results_v1",
  ACTIVE_EXAM: "cbt_active_exam_v1",
  USERS: "cbt_users_v1",
  STUDENT_REGISTRATIONS: "cbt_student_registrations_v1",
  SHARED_DATA: "cbt_shared_data_v1"
};

function Header({user, onLogout, onLogoClick}){
  return (
    <div className="bg-white border-b">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onLogoClick}
            className="flex items-center gap-2 text-left hover:text-blue-600 transition-colors cursor-pointer"
            title={!user ? "Click to reveal admin access" : ""}
          >
            <div className="h-10 md:h-12 w-10 md:w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg md:text-xl">CBT</span>
            </div>
            <span className="text-base sm:text-lg font-bold whitespace-nowrap">CBT Platform</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button onClick={onLogout} className="px-3 py-1.5 rounded-xl bg-gray-800 text-white text-sm hover:bg-black">Logout</button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AdminLogin({onLogin, onBack}){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    if (!username || !password) {
      setError("Please enter both username and password");
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting admin login for username:', username);
      
      const user = await authenticateUser(username, password);
      console.log('🔐 Authentication result:', user);
      
      if (user && user.role === "admin") {
        console.log('✅ Admin login successful');
        onLogin(user);
      } else {
        console.log('❌ Admin login failed - invalid credentials or role');
        setError("Invalid admin credentials. Please check your username and password.");
      }
    } catch (error) {
      console.error('❌ Error during admin login:', error);
      setError(`Login failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🔐 Admin Login</h2>
          <p className="text-gray-600">Access the admin panel</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter admin username"
              autoComplete="username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : (
              'Sign In as Admin'
            )}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Student Login
          </button>
        </div>
      </div>
    </div>
  );
}

function Login({onLogin}){
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    if (!username || !password) {
      setError("Please enter both username and password");
      setIsLoading(false);
      return;
    }

    try {
      // Only student authentication - admin access is separate
      const user = await authenticateUser(username, password);
      if (user && user.role === "student") {
        onLogin(user);
      } else if (user && user.role === "admin") {
        setError("This is an admin account. Please use the admin login instead.");
      } else {
        setError("Invalid username or password. Please check your credentials or register as a new student.");
      }
    } catch (error) {
      console.error('Error during student login:', error);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!username || !password || !fullName || !email) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const studentData = {
        username,
        password,
        fullName,
        email
      };
      
      await registerStudent(studentData);
      setSuccess("Registration successful! You can now login with your credentials.");
      setMode("login");
      setUsername("");
      setPassword("");
      setFullName("");
      setEmail("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6 mt-10">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Student Portal</h2>
        <p className="text-gray-600 text-sm">Login or register to take exams</p>
      </div>
      
      <div className="flex mb-6">
        <button 
          onClick={() => {setMode("login"); setError(""); setSuccess("");}} 
          className={`flex-1 py-2 text-sm font-medium ${mode === "login" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500"}`}
        >
          Login
        </button>
        <button 
          onClick={() => {setMode("register"); setError(""); setSuccess("");}} 
          className={`flex-1 py-2 text-sm font-medium ${mode === "register" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500"}`}
        >
          Register
        </button>
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{error}</div>}
      {success && <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-xl">{success}</div>}

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="student-username" className="block text-sm mb-1">Username</label>
            <input 
              id="student-username"
              name="username"
              type="text"
              value={username} 
              onChange={e=>setUsername(e.target.value)} 
              className="w-full border rounded-xl px-3 py-2" 
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="student-password" className="block text-sm mb-1">Password</label>
            <div className="relative">
              <input 
                id="student-password"
                name="password"
                type={showLoginPassword ? "text" : "password"} 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                className="w-full border rounded-xl px-3 py-2 pr-10" 
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={()=>setShowLoginPassword(s=>!s)}
                className="absolute inset-y-0 right-2 text-xs text-gray-500"
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
              >
                {showLoginPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.338 6.244 18 12 18c1.91 0 3.547-.276 4.93-.757M6.228 6.228A10.45 10.45 0 0112 6c5.756 0 8.774 2.662 10.066 6a10.523 10.523 0 01-4.26 4.52M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.01 9.964 7.183.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5-4.64 0-8.577-3.01-9.964-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-xl py-2.5 font-semibold ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : (
              'Login as Student'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="student-fullname" className="block text-sm mb-1">Full Name *</label>
            <input 
              id="student-fullname"
              name="fullName"
              type="text"
              value={fullName} 
              onChange={e=>setFullName(e.target.value)} 
              className="w-full border rounded-xl px-3 py-2" 
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="student-email" className="block text-sm mb-1">Email *</label>
            <input 
              id="student-email"
              name="email"
              type="email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              className="w-full border rounded-xl px-3 py-2" 
              placeholder="Enter your email address"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="student-register-username" className="block text-sm mb-1">Username *</label>
            <input 
              id="student-register-username"
              name="username"
              type="text"
              value={username} 
              onChange={e=>setUsername(e.target.value)} 
              className="w-full border rounded-xl px-3 py-2" 
              placeholder="Choose a username"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="student-register-password" className="block text-sm mb-1">Password *</label>
            <div className="relative">
              <input 
                id="student-register-password"
                name="password"
                type={showRegisterPassword ? "text" : "password"} 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                className="w-full border rounded-xl px-3 py-2 pr-10" 
                placeholder="Choose a password (min 6 characters)"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={()=>setShowRegisterPassword(s=>!s)}
                className="absolute inset-y-0 right-2 text-xs text-gray-500"
                aria-label={showRegisterPassword ? "Hide password" : "Show password"}
              >
                {showRegisterPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.338 6.244 18 12 18c1.91 0 3.547-.276 4.93-.757M6.228 6.228A10.45 10.45 0 0112 6c5.756 0 8.774 2.662 10.066 6a10.523 10.523 0 01-4.26 4.52M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.01 9.964 7.183.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5-4.64 0-8.577-3.01-9.964-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="student-confirm-password" className="block text-sm mb-1">Confirm Password *</label>
            <div className="relative">
              <input 
                id="student-confirm-password"
                name="confirmPassword"
                type={showRegisterConfirm ? "text" : "password"} 
                value={confirmPassword} 
                onChange={e=>setConfirmPassword(e.target.value)} 
                className="w-full border rounded-xl px-3 py-2 pr-10" 
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={()=>setShowRegisterConfirm(s=>!s)}
                className="absolute inset-y-0 right-2 text-xs text-gray-500"
                aria-label={showRegisterConfirm ? "Hide password" : "Show password"}
              >
                {showRegisterConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.338 6.244 18 12 18c1.91 0 3.547-.276 4.93-.757M6.228 6.228A10.45 10.45 0 0112 6c5.756 0 8.774 2.662 10.066 6a10.523 10.523 0 01-4.26 4.52M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.01 9.964 7.183.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5-4.64 0-8.577-3.01-9.964-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-semibold">
            Register as Student
          </button>
        </form>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p>Students must register first before they can login and take exams.</p>
      </div>
    </div>
  );
}

function AdminPanel({ user, tenant, onCBTView }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
        <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="opacity-90">
          Welcome back, {user.fullName || user.username}! Manage your institution's CBT system.
        </p>
        <p className="text-sm opacity-75 mt-1">
          Institution: {tenant?.name || 'Unknown Institution'}
        </p>
            </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Exams</p>
              <p className="text-2xl font-semibold text-gray-900">1</p>
                        </div>
                      </div>
                      </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
                      </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
                    </div>
                </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
          </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Exam Results</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
                    </div>
                  </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
                  <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
                  </button>
                  <button 
              onClick={() => setActiveTab('cbt')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cbt'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              CBT Management
                  </button>
                  <button 
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
                  </button>
                  <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
                  </button>
          </nav>
                </div>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                  onClick={onCBTView}
                  className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">📝</div>
                    <div className="font-medium text-lg">Manage CBT Exams</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Upload questions, manage exams, view results
                </div>
              </div>
                </button>

            <button 
                  onClick={() => setActiveTab('users')}
                  className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">👥</div>
                    <div className="font-medium text-lg">Manage Users</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Add students, manage permissions
          </div>
              </div>
              </button>
            </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Getting Started</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Upload your exam questions using Microsoft Word (.docx) format</li>
                  <li>• Set exam title and configure settings</li>
                  <li>• Students can then take the exam and view results</li>
                  <li>• Export results to Excel or Word for analysis</li>
                </ul>
              </div>
        </div>
      )}

          {activeTab === 'cbt' && (
        <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">CBT Management</h3>
              <p className="text-gray-600">Click the button below to access the full CBT management system.</p>
            <button 
                onClick={onCBTView}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
            >
                Open CBT Management
            </button>
          </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  User management features will be implemented here. This will include:
                </p>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• View all registered students</li>
                  <li>• Add new students</li>
                  <li>• Manage student permissions</li>
                  <li>• View student exam history</li>
                </ul>
            </div>
        </div>
      )}

          {activeTab === 'settings' && (
        <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Institution Settings</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  Institution settings and configuration options will be available here.
                </p>
            </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

function StudentPanel({ user, tenant, onExamView }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Student Dashboard</h1>
        <p className="opacity-90">
          Welcome back, {user.fullName || user.username}! Take your exams.
        </p>
        <p className="text-sm opacity-75 mt-1">
          Institution: {tenant?.name || 'Unknown Institution'}
        </p>
          </div>
          
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
          </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Exams</p>
              <p className="text-2xl font-semibold text-gray-900">1</p>
            </div>
            </div>
          </div>
          
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
          </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
      </div>
    </div>
          </div>
          
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
          </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Exam Results</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
            </div>
          </div>
          
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'exams'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Exams
            </button>
          <button
              onClick={() => setActiveTab('results')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Results
          </button>
              <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
              </button>
          </nav>
          </div>
          
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                  onClick={() => setActiveTab('exams')}
                  className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">📝</div>
                    <div className="font-medium text-lg">Take Exams</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Available exams to take
            </div>
          </div>
                </button>
          
            <button
                  onClick={() => setActiveTab('results')}
                  className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">📊</div>
                    <div className="font-medium text-lg">View Results</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Your exam history
                    </div>
                  </div>
            </button>
          </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Getting Started</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check available exams in the "Exams" tab.</li>
                  <li>• Click on an exam to start.</li>
                  <li>• Answer questions and submit your exam.</li>
                  <li>• View your exam results in the "Results" tab.</li>
                </ul>
      </div>
    </div>
          )}

          {activeTab === 'exams' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Available Exams</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  No exams available at this time. Please check back later.
                </p>
        </div>
      </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Exam Results</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  Your exam history will be displayed here.
                </p>
        </div>
        </div>
      )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Student Settings</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  Student settings and preferences will be available here.
                </p>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [showAdminLink, setShowAdminLink] = useState(false);
  const [institutionData, setInstitutionData] = useState(null);
  const [currentView, setCurrentView] = useState("main"); // "main", "cbt-admin", "student-exam"
  // eslint-disable-next-line no-unused-vars
  const [selectedExam, setSelectedExam] = useState(null); // Used in handleStudentExamView

  useEffect(() => {
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Pathname:', window.location.pathname);
    console.log('🔍 Search:', window.location.search);
    
    // Get URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if this is a multi-tenant admin route
    if (window.location.pathname === '/admin' || window.location.pathname === '/admin/' || urlParams.get('admin') === 'true') {
      console.log('🏢 Multi-tenant admin route detected');
      
      // Check if multi-tenant admin is authenticated
      const token = localStorage.getItem('multi_tenant_admin_token');
      if (token) {
        setView("multi-tenant-admin");
      } else {
        setView("multi-tenant-admin-login");
      }
      return; // Exit early for admin routes
    }
    
    // Check if this is an institution-specific route
    let slug = urlParams.get('slug');
    
    // If no slug in query params, check if pathname contains an institution slug
    if (!slug && window.location.pathname !== '/' && window.location.pathname !== '/admin') {
      const pathParts = window.location.pathname.split('/').filter(part => part);
      if (pathParts.length > 0) {
        // Check if the first path part looks like an institution slug
        const potentialSlug = pathParts[0];
        if (potentialSlug.includes('-') || potentialSlug.length > 5) {
          slug = potentialSlug;
          console.log('🏫 Institution route detected from pathname:', slug);
        }
      }
    }
    
    console.log('🔍 Checking URL parameters:', { slug, search: window.location.search, href: window.location.href });
    
    if (slug) {
      console.log('🏫 Institution route detected:', slug);
      // Set view immediately for better UX, load data in background
      setView("institution-login");
      // Load institution data in background
      loadInstitutionData(slug);
      return; // Exit early for institution routes
    } else {
      console.log('🏠 Regular route detected');
      // Check if user is already logged in with institution context
      const saved = localStorage.getItem("cbt_logged_in_user");
      const institutionSlug = localStorage.getItem("institution_slug");
      
      if (saved && institutionSlug) {
        // Load institution data for logged-in user
        loadInstitutionData(institutionSlug);
        setUser(JSON.parse(saved));
        setView("home");
      } else if (saved) {
        setUser(JSON.parse(saved));
        setView("home");
      }
    }
    
    // Ensure admin user exists in localStorage
    try {
      console.log('🔧 Ensuring admin user exists...');
      const users = JSON.parse(localStorage.getItem("cbt_users_v1") || "[]");
      console.log('📋 Current users:', users.length);
      
      const adminExists = users.some(user => user.username === "admin" && user.role === "admin");
      console.log('👤 Admin exists:', adminExists);
      
      if (!adminExists) {
        console.log('👤 Creating default admin user...');
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
        localStorage.setItem("cbt_users_v1", JSON.stringify(users));
        console.log('✅ Default admin user created successfully');
        console.log('🔐 Login credentials: admin / admin123');
      } else {
        console.log('✅ Admin user already exists');
      }
    } catch (error) {
      console.error('❌ Error ensuring admin user exists:', error);
    }
    
    // Check API connection on app load
    const checkConnection = async () => {
      try {
        const connectionStatus = await dataService.checkApiConnection();
        console.log('🔍 App startup - API connection status:', connectionStatus);
      } catch (error) {
        console.error('Error checking API connection:', error);
      }
    };
    
    checkConnection();
  }, []);

  // Load institution data for institution-specific routes
  const loadInstitutionData = async (slug) => {
    try {
      // Load institution data from MongoDB API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        const response = await fetch(`https://cbt-rew7.onrender.com/api/tenant/${slug}/profile`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Institution not found or suspended');
        }
        
        const data = await response.json();
        setInstitutionData(data);
        
        // Store institution data in localStorage for use throughout the app
        localStorage.setItem('institution_data', JSON.stringify(data));
        localStorage.setItem('institution_slug', slug);
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('Institution data fetch timed out, will retry from component');
          return;
        }
        throw fetchError;
      }
      
      } catch (error) {
      console.error('Failed to load institution data:', error);
      // If institution not found, show error or redirect
      console.error('Institution not found or suspended');
    }
  };

  const onLogout = () => {
    setUser(null);
    localStorage.removeItem("cbt_logged_in_user");
    setView("login");
    setCurrentView("main");
  };

  // Multi-tenant admin login handler
  const handleMultiTenantAdminLogin = (loginData) => {
    setView("multi-tenant-admin");
  };

  // Hidden admin access - click on the logo
  const handleLogoClick = () => {
    if (!user) {
      setShowAdminLink(false);
      setView("admin-login");
    }
  };

  // Keyboard shortcut for admin access (Ctrl + Alt + A)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!user && e.ctrlKey && e.altKey && e.key === 'A') {
        e.preventDefault();
        setShowAdminLink(true);
        setTimeout(() => setShowAdminLink(false), 5000);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [user]);

  // CBT System Navigation Handlers
  const handleCBTAdminView = () => {
    setCurrentView("cbt-admin");
  };

  const handleStudentExamView = (exam) => {
    setSelectedExam(exam);
    setCurrentView("student-exam");
  };

  const handleBackToMain = () => {
    setCurrentView("main");
    setSelectedExam(null);
  };

  // Institution route is now handled in the main useEffect above

  // CBT System Views
  if (currentView === "cbt-admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto p-4">
                <button
              onClick={handleBackToMain}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
                >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Main Dashboard
                </button>
            <CBTExam user={user} tenant={institutionData} />
              </div>
          </div>
      </div>
    );
  }

  if (currentView === "student-exam") {
    return (
      <StudentExam 
        user={user} 
        tenant={institutionData} 
        onComplete={handleBackToMain}
      />
    );
  }

    return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hide header on institution pages to avoid duplicate branding */}
      {view !== "institution-login" && currentView !== "cbt-admin" && currentView !== "student-exam" && (
        <Header user={user} onLogout={onLogout} onLogoClick={handleLogoClick} institutionData={institutionData} />
      )}
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-8 py-4 sm:py-8">
        {user ? (
          user.role === "admin" ? (
            <AdminPanel 
              user={user} 
              tenant={institutionData}
              onCBTView={handleCBTAdminView}
            />
          ) : (
            <StudentPanel 
              user={user} 
              tenant={institutionData}
              onExamView={handleStudentExamView}
            />
          )
        ) : (
          <>
            {view === "multi-tenant-admin-login" ? (
              <MultiTenantAdminLogin onLogin={handleMultiTenantAdminLogin} />
            ) : view === "multi-tenant-admin" ? (
              <MultiTenantAdmin />
            ) : view === "institution-login" ? (
              <InstitutionLoginPage />
            ) : (
              <>
                {view !== "admin-login" && (
                  <Login 
                    onLogin={(u)=>{setUser(u); localStorage.setItem("cbt_logged_in_user", JSON.stringify(u)); setView("home");}}
                    institutionData={institutionData}
                  />
                )}
                {showAdminLink && (
                  <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-center">
                      <p className="text-red-700 font-semibold mb-2">🔐 Admin Access</p>
              <button 
                        onClick={() => setView("admin-login")}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                        Access Admin Panel
              </button>
          </div>
        </div>
      )}
                {view === "admin-login" && (
                  <AdminLogin 
                    onLogin={(u)=>{setUser(u); localStorage.setItem("cbt_logged_in_user", JSON.stringify(u)); setView("home");}}
                    onBack={() => setView("login")}
                    institutionData={institutionData}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
      <footer className="text-center text-xs text-gray-500 py-6">
        © {new Date().getFullYear()} {institutionData ? institutionData.name : 'CBT Platform'}
        {!user && (
          <div className="mt-1 text-gray-400">
            <span className="opacity-30 hover:opacity-100 transition-opacity cursor-help" title="Admin Access: Click logo or press Ctrl+Alt+A">
              🔐
            </span>
    </div>
        )}
      </footer>
    </div>
  );
}

// User management functions - now using dataService
async function loadUsers() {
  try {
    const data = await dataService.loadUsers();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

async function saveUsers(users) {
  try {
    return await dataService.saveUsers(users);
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

async function authenticateUser(username, password) {
  console.log('🔐 Authenticating user:', username);
  
  try {
    // Use dataService to load users (handles both cloud and localStorage)
    const users = await dataService.loadUsers();
    console.log('👥 Total users loaded:', users.length);
    
    // Find the user
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    
    if (user) {
      // Make this admin the default admin if they're logging in
      if (user.role === "admin" && !user.isDefaultAdmin) {
        console.log('👑 Making current admin the default admin...');
        user.isDefaultAdmin = true;
        user.canDeleteDefaultAdmin = true;
        
        // Update the user in the database
        const updatedUsers = users.map(u => 
          u.username === user.username ? user : u
        );
        await dataService.saveUsers(updatedUsers);
        console.log('✅ Current admin is now the default admin');
      }
      
      console.log('✅ Authentication successful:', user.username, user.role);
      return user;
    } else {
      console.log('❌ Authentication failed - user not found or wrong password');
      console.log('🔍 Searched for:', username.toLowerCase());
      console.log('🔍 Available users:', users.map(u => u.username.toLowerCase()));
      return null;
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return null;
  }
}

async function registerStudent(studentData) {
  try {
    const users = await loadUsers();
    
    // Check if username already exists (case-insensitive)
    const newName = (studentData.username || "").trim().toLowerCase();
    if (users.find(u => (u.username || "").toLowerCase() === newName)) {
      throw new Error("Username already exists. Please choose a different username.");
    }
    
    // Check if email already exists
    if (users.find(u => u.email === studentData.email)) {
      throw new Error("Email already registered. Please use a different email.");
    }
    
    const newStudent = {
      ...studentData,
      role: "student",
      registeredAt: new Date().toISOString()
    };
    
    users.push(newStudent);
    await saveUsers(users);
    
    // Also save to registrations for admin tracking
    const registrations = loadStudentRegistrations();
    registrations.push(newStudent);
    localStorage.setItem(LS_KEYS.STUDENT_REGISTRATIONS, JSON.stringify(registrations));
    
    return newStudent;
  } catch (error) {
    console.error('Error registering student:', error);
    throw error;
  }
}

function loadStudentRegistrations() {
  const saved = localStorage.getItem(LS_KEYS.STUDENT_REGISTRATIONS);
  return saved ? JSON.parse(saved) : [];
}

export default App;
