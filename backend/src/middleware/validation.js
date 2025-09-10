const { body, param, query, validationResult } = require('express-validator');
const { sanitizeBody, sanitizeParam, sanitizeQuery } = require('express-validator');

// Common validation patterns
const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  USERNAME: /^[a-zA-Z0-9._-]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  ALPHABETIC: /^[a-zA-Z\s]+$/,
  NUMERIC: /^\d+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SLUG: /^[a-z0-9-]+$/
};

// Input length limits
const INPUT_LIMITS = {
  USERNAME: { min: 3, max: 20 },
  PASSWORD: { min: 8, max: 128 },
  FULL_NAME: { min: 2, max: 50 },
  EMAIL: { max: 254 },
  PHONE: { max: 20 },
  EXAM_TITLE: { min: 3, max: 100 },
  QUESTION_TEXT: { min: 10, max: 1000 },
  OPTION_TEXT: { min: 1, max: 200 },
  INSTITUTION_NAME: { min: 3, max: 100 },
  DESCRIPTION: { max: 500 }
};

// Sanitization functions
const sanitizeInput = {
  // Remove HTML tags and dangerous characters
  html: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  },

  // Remove SQL injection patterns
  sql: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[';\\*|%+=<>[\]{}()^$!@#&~`-]/g, '')
      .trim();
  },

  // Basic text sanitization
  text: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>\"'&]/g, (match) => {
        const escapeMap = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return escapeMap[match];
      })
      .trim();
  },

  // Remove extra whitespace
  whitespace: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/\s+/g, ' ').trim();
  },

  // Convert to lowercase
  lowercase: (input) => {
    if (typeof input !== 'string') return input;
    return input.toLowerCase();
  },

  // Convert to uppercase
  uppercase: (input) => {
    if (typeof input !== 'string') return input;
    return input.toUpperCase();
  }
};

// Validation middleware factory
const createValidationMiddleware = (validations) => {
  return async (req, res, next) => {
    // Run validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value
        }))
      });
    }

    // Sanitize inputs
    if (req.body) {
      req.body = sanitizeRequestBody(req.body);
    }
    if (req.params) {
      req.params = sanitizeRequestParams(req.params);
    }
    if (req.query) {
      req.query = sanitizeRequestQuery(req.query);
    }

    next();
  };
};

// Sanitize request body
const sanitizeRequestBody = (body) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      // Apply appropriate sanitization based on field type
      if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeInput.lowercase(sanitizeInput.html(sanitizeInput.whitespace(value)));
      } else if (key.toLowerCase().includes('username') || key.toLowerCase().includes('slug')) {
        sanitized[key] = sanitizeInput.lowercase(sanitizeInput.html(sanitizeInput.whitespace(value)));
      } else if (key.toLowerCase().includes('password')) {
        // Don't sanitize passwords, just trim whitespace
        sanitized[key] = value.trim();
      } else if (key.toLowerCase().includes('name') || key.toLowerCase().includes('title')) {
        sanitized[key] = sanitizeInput.html(sanitizeInput.whitespace(value));
      } else {
        sanitized[key] = sanitizeInput.html(sanitizeInput.whitespace(value));
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Sanitize request parameters
const sanitizeRequestParams = (params) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput.html(sanitizeInput.whitespace(value));
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Sanitize request query
const sanitizeRequestQuery = (query) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput.html(sanitizeInput.whitespace(value));
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Common validation rules
const validationRules = {
  // User registration validation
  userRegistration: [
    body('username')
      .isLength({ min: INPUT_LIMITS.USERNAME.min, max: INPUT_LIMITS.USERNAME.max })
      .withMessage(`Username must be between ${INPUT_LIMITS.USERNAME.min} and ${INPUT_LIMITS.USERNAME.max} characters`)
      .matches(VALIDATION_PATTERNS.USERNAME)
      .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens')
      .custom((value) => {
        const reservedUsernames = ['admin', 'administrator', 'root', 'superadmin', 'system', 'test', 'user', 'guest'];
        if (reservedUsernames.includes(value.toLowerCase())) {
          throw new Error('This username is reserved and cannot be used');
        }
        return true;
      }),
    
    body('password')
      .isLength({ min: INPUT_LIMITS.PASSWORD.min, max: INPUT_LIMITS.PASSWORD.max })
      .withMessage(`Password must be between ${INPUT_LIMITS.PASSWORD.min} and ${INPUT_LIMITS.PASSWORD.max} characters`)
      .matches(VALIDATION_PATTERNS.PASSWORD)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      .custom((value) => {
        const weakPasswords = ['password', '123456', '123456789', 'qwerty', 'abc123', 'password123', 'admin', 'letmein'];
        if (weakPasswords.includes(value.toLowerCase())) {
          throw new Error('This password is too common. Please choose a stronger password');
        }
        return true;
      }),
    
    body('fullName')
      .isLength({ min: INPUT_LIMITS.FULL_NAME.min, max: INPUT_LIMITS.FULL_NAME.max })
      .withMessage(`Full name must be between ${INPUT_LIMITS.FULL_NAME.min} and ${INPUT_LIMITS.FULL_NAME.max} characters`)
      .matches(VALIDATION_PATTERNS.ALPHABETIC)
      .withMessage('Full name can only contain letters and spaces')
      .custom((value) => {
        if (/\s{2,}/.test(value)) {
          throw new Error('Full name cannot contain multiple consecutive spaces');
        }
        return true;
      }),
    
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .isLength({ max: INPUT_LIMITS.EMAIL.max })
      .withMessage(`Email must be no more than ${INPUT_LIMITS.EMAIL.max} characters`),
    
    body('phone')
      .optional()
      .isLength({ min: 10, max: INPUT_LIMITS.PHONE.max })
      .withMessage(`Phone number must be between 10 and ${INPUT_LIMITS.PHONE.max} characters`)
      .matches(VALIDATION_PATTERNS.PHONE)
      .withMessage('Please enter a valid phone number'),
    
    body('tenant_slug')
      .notEmpty()
      .withMessage('Tenant slug is required')
      .matches(VALIDATION_PATTERNS.SLUG)
      .withMessage('Tenant slug can only contain lowercase letters, numbers, and hyphens')
  ],

  // User login validation
  userLogin: [
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Username must be between 1 and 50 characters'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 1, max: 128 })
      .withMessage('Password must be between 1 and 128 characters'),
    
    body('tenant_slug')
      .optional()
      .matches(VALIDATION_PATTERNS.SLUG)
      .withMessage('Tenant slug can only contain lowercase letters, numbers, and hyphens')
  ],

  // Exam creation validation
  examCreation: [
    body('title')
      .isLength({ min: INPUT_LIMITS.EXAM_TITLE.min, max: INPUT_LIMITS.EXAM_TITLE.max })
      .withMessage(`Exam title must be between ${INPUT_LIMITS.EXAM_TITLE.min} and ${INPUT_LIMITS.EXAM_TITLE.max} characters`)
      .matches(VALIDATION_PATTERNS.ALPHANUMERIC)
      .withMessage('Exam title can only contain letters, numbers, and spaces'),
    
    body('description')
      .optional()
      .isLength({ max: INPUT_LIMITS.DESCRIPTION.max })
      .withMessage(`Description must be no more than ${INPUT_LIMITS.DESCRIPTION.max} characters`),
    
    body('duration')
      .optional()
      .isInt({ min: 1, max: 480 })
      .withMessage('Duration must be between 1 and 480 minutes'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value')
  ],

  // Question creation validation
  questionCreation: [
    body('text')
      .isLength({ min: INPUT_LIMITS.QUESTION_TEXT.min, max: INPUT_LIMITS.QUESTION_TEXT.max })
      .withMessage(`Question text must be between ${INPUT_LIMITS.QUESTION_TEXT.min} and ${INPUT_LIMITS.QUESTION_TEXT.max} characters`),
    
    body('options')
      .isArray({ min: 2, max: 10 })
      .withMessage('Question must have between 2 and 10 options'),
    
    body('options.*')
      .isLength({ min: INPUT_LIMITS.OPTION_TEXT.min, max: INPUT_LIMITS.OPTION_TEXT.max })
      .withMessage(`Each option must be between ${INPUT_LIMITS.OPTION_TEXT.min} and ${INPUT_LIMITS.OPTION_TEXT.max} characters`),
    
    body('correctAnswer')
      .isInt({ min: 0, max: 9 })
      .withMessage('Correct answer must be a valid option index (0-9)'),
    
    body('examId')
      .notEmpty()
      .withMessage('Exam ID is required')
      .isMongoId()
      .withMessage('Invalid exam ID format')
  ],

  // Institution creation validation
  institutionCreation: [
    body('name')
      .isLength({ min: INPUT_LIMITS.INSTITUTION_NAME.min, max: INPUT_LIMITS.INSTITUTION_NAME.max })
      .withMessage(`Institution name must be between ${INPUT_LIMITS.INSTITUTION_NAME.min} and ${INPUT_LIMITS.INSTITUTION_NAME.max} characters`)
      .matches(VALIDATION_PATTERNS.ALPHANUMERIC)
      .withMessage('Institution name can only contain letters, numbers, and spaces'),
    
    body('slug')
      .isLength({ min: 3, max: 50 })
      .withMessage('Slug must be between 3 and 50 characters')
      .matches(VALIDATION_PATTERNS.SLUG)
      .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
    
    body('description')
      .optional()
      .isLength({ max: INPUT_LIMITS.DESCRIPTION.max })
      .withMessage(`Description must be no more than ${INPUT_LIMITS.DESCRIPTION.max} characters`),
    
    body('website')
      .optional()
      .matches(VALIDATION_PATTERNS.URL)
      .withMessage('Please enter a valid website URL'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please enter a valid email address')
      .isLength({ max: INPUT_LIMITS.EMAIL.max })
      .withMessage(`Email must be no more than ${INPUT_LIMITS.EMAIL.max} characters`)
  ],

  // Parameter validation
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ],

  slug: [
    param('slug')
      .matches(VALIDATION_PATTERNS.SLUG)
      .withMessage('Invalid slug format')
  ],

  // Query validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

// Create validation middleware for each rule set
const validateUserRegistration = createValidationMiddleware(validationRules.userRegistration);
const validateUserLogin = createValidationMiddleware(validationRules.userLogin);
const validateExamCreation = createValidationMiddleware(validationRules.examCreation);
const validateQuestionCreation = createValidationMiddleware(validationRules.questionCreation);
const validateInstitutionCreation = createValidationMiddleware(validationRules.institutionCreation);
const validateMongoId = createValidationMiddleware(validationRules.mongoId);
const validateSlug = createValidationMiddleware(validationRules.slug);
const validatePagination = createValidationMiddleware(validationRules.pagination);

// Rate limiting validation
const validateRateLimit = (req, res, next) => {
  // Basic rate limiting validation
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  // Check for suspicious patterns
  if (!userAgent || userAgent.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request'
    });
  }
  
  // Check for common bot patterns
  const botPatterns = ['bot', 'crawler', 'spider', 'scraper'];
  if (botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    return res.status(403).json({
      success: false,
      message: 'Automated requests not allowed'
    });
  }
  
  next();
};

// Security headers middleware
const addSecurityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

module.exports = {
  createValidationMiddleware,
  validateUserRegistration,
  validateUserLogin,
  validateExamCreation,
  validateQuestionCreation,
  validateInstitutionCreation,
  validateMongoId,
  validateSlug,
  validatePagination,
  validateRateLimit,
  addSecurityHeaders,
  sanitizeInput,
  VALIDATION_PATTERNS,
  INPUT_LIMITS
};
