import React, { useState, useEffect } from 'react';
import { healthCheck, getApiInfo } from '../services/apiService';

const ApiTest = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testBackendConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test health endpoint
      const health = await healthCheck();
      setHealthStatus(health);
      
      // Test API info endpoint
      const info = await getApiInfo();
      setApiInfo(info);
    } catch (err) {
      setError(err.message);
      console.error('Backend connection test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Backend Connection Test</h2>
      
      <div className="space-y-4">
        {/* Health Check */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Health Check</h3>
          {loading ? (
            <p className="text-blue-600">Testing connection...</p>
          ) : error ? (
            <div className="text-red-600">
              <p>❌ Connection failed: {error}</p>
              <p className="text-sm mt-2">
                Make sure your Render backend is deployed and the URL is correct.
              </p>
            </div>
          ) : healthStatus ? (
            <div className="text-green-600">
              <p>✅ Backend is healthy!</p>
              <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>

        {/* API Info */}
        {apiInfo && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">API Information</h3>
            <div className="text-green-600">
              <p>✅ API is responding!</p>
              <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
                {JSON.stringify(apiInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Retry Button */}
        <button
          onClick={testBackendConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Retry Connection Test'}
        </button>

        {/* Configuration Info */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Configuration</h3>
          <p className="text-sm">
            <strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:5000'}
          </p>
          <p className="text-sm">
            <strong>Environment:</strong> {process.env.REACT_APP_ENVIRONMENT || 'development'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiTest; 