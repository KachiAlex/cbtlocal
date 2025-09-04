import { apiRequest, buildApiUrl, getAuthHeaders } from '../config/api';

// Health check service
export const healthCheck = async () => {
  return await apiRequest('/health');
};

// API info service
export const getApiInfo = async () => {
  return await apiRequest('/api');
};

// Authentication services (when you implement them)
export const authService = {
  login: async (credentials) => {
    return await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  register: async (userData) => {
    return await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  logout: async (token) => {
    return await apiRequest('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
  },
};

// Exam services (when you implement them)
export const examService = {
  getAll: async (token) => {
    return await apiRequest('/api/exams', {
      headers: getAuthHeaders(token),
    });
  },
  
  getById: async (id, token) => {
    return await apiRequest(`/api/exams/${id}`, {
      headers: getAuthHeaders(token),
    });
  },
  
  create: async (examData, token) => {
    return await apiRequest('/api/exams', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(examData),
    });
  },
  
  update: async (id, examData, token) => {
    return await apiRequest(`/api/exams/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(examData),
    });
  },
  
  delete: async (id, token) => {
    return await apiRequest(`/api/exams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  },
};

// Question services (when you implement them)
export const questionService = {
  getAll: async (token) => {
    return await apiRequest('/api/questions', {
      headers: getAuthHeaders(token),
    });
  },
  
  getById: async (id, token) => {
    return await apiRequest(`/api/questions/${id}`, {
      headers: getAuthHeaders(token),
    });
  },
  
  create: async (questionData, token) => {
    return await apiRequest('/api/questions', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(questionData),
    });
  },
  
  update: async (id, questionData, token) => {
    return await apiRequest(`/api/questions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(questionData),
    });
  },
  
  delete: async (id, token) => {
    return await apiRequest(`/api/questions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  },
};

// Result services (when you implement them)
export const resultService = {
  getAll: async (token) => {
    return await apiRequest('/api/results', {
      headers: getAuthHeaders(token),
    });
  },
  
  getById: async (id, token) => {
    return await apiRequest(`/api/results/${id}`, {
      headers: getAuthHeaders(token),
    });
  },
  
  create: async (resultData, token) => {
    return await apiRequest('/api/results', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(resultData),
    });
  },
  
  update: async (id, resultData, token) => {
    return await apiRequest(`/api/results/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(resultData),
    });
  },
  
  delete: async (id, token) => {
    return await apiRequest(`/api/results/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  },
};

// User services (when you implement them)
export const userService = {
  getAll: async (token) => {
    return await apiRequest('/api/users', {
      headers: getAuthHeaders(token),
    });
  },
  
  getById: async (id, token) => {
    return await apiRequest(`/api/users/${id}`, {
      headers: getAuthHeaders(token),
    });
  },
  
  update: async (id, userData, token) => {
    return await apiRequest(`/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(userData),
    });
  },
  
  delete: async (id, token) => {
    return await apiRequest(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  },
}; 