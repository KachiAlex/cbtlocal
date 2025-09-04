// Token Management Service for Multi-Tenant Admin
class TokenService {
  constructor() {
    this.API_BASE_URL = 'https://cbt-rew7.onrender.com';
    this.TOKEN_KEY = 'multi_tenant_admin_token';
    this.REFRESH_TOKEN_KEY = 'multi_tenant_admin_refresh_token';
    this.USER_KEY = 'multi_tenant_admin_user';
    this.EXPIRES_KEY = 'multi_tenant_admin_token_expires';
    
    // Set up automatic token refresh
    this.setupAutoRefresh();
  }

  // Get current access token
  getAccessToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Get user data
  getUser() {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if token is expired
  isTokenExpired() {
    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);
    if (!expiresAt) return true;
    
    // Check if token expires in the next 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() + bufferTime > parseInt(expiresAt);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getAccessToken();
    return token && !this.isTokenExpired();
  }

  // Refresh access token using refresh token
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.API_BASE_URL}/api/multi-tenant-admin/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      // Update stored tokens
      localStorage.setItem(this.TOKEN_KEY, data.token);
      localStorage.setItem(this.EXPIRES_KEY, Date.now() + data.expiresIn);
      
      console.log('✅ Token refreshed successfully');
      return data.token;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  // Get valid token (refresh if needed)
  async getValidToken() {
    if (this.isTokenExpired()) {
      console.log('🔄 Token expired, refreshing...');
      return await this.refreshToken();
    }
    return this.getAccessToken();
  }

  // Setup automatic token refresh
  setupAutoRefresh() {
    // Check token every 5 minutes
    setInterval(() => {
      if (this.isAuthenticated() && this.isTokenExpired()) {
        console.log('🔄 Auto-refreshing expired token...');
        this.refreshToken().catch(error => {
          console.error('Auto-refresh failed:', error);
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Logout user
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
    window.location.reload();
  }

  // Store tokens after login
  storeTokens(token, refreshToken, user, expiresIn) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.EXPIRES_KEY, Date.now() + expiresIn);
  }
}

// Create singleton instance
const tokenService = new TokenService();
export default tokenService;
