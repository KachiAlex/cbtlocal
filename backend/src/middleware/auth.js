// Authentication middleware for multi-tenant admin platform
const { generateToken, generateRefreshToken, verifyToken } = require('../config/jwt');

// Super admin credentials
const SUPER_ADMIN = {
  username: 'superadmin',
  password: 'superadmin123'
};

// JWT authentication middleware for multi-tenant admin
const authenticateMultiTenantAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Login endpoint for multi-tenant admin
const loginMultiTenantAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check credentials
    if (username === SUPER_ADMIN.username && password === SUPER_ADMIN.password) {
      // Generate JWT tokens
      const userPayload = {
        username: SUPER_ADMIN.username,
        role: 'super_admin',
        type: 'multi_tenant_admin'
      };
      
      const accessToken = generateToken(userPayload);
      const refreshToken = generateRefreshToken(userPayload);
      
      res.json({
        message: 'Login successful',
        token: accessToken,
        refreshToken: refreshToken,
        expiresIn: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
        user: {
          username: SUPER_ADMIN.username,
          role: 'super_admin'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = {
  authenticateMultiTenantAdmin,
  loginMultiTenantAdmin
}; 