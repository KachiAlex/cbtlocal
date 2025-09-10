const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Tenant association
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  
  // User information
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Authentication
  password: {
    type: String,
    required: true
  },
  
  // Role and permissions
  role: {
    type: String,
    enum: ['super_admin', 'managed_admin', 'tenant_admin', 'admin', 'teacher', 'student'],
    default: 'student'
  },
  
  // Default admin flags
  is_default_admin: {
    type: Boolean,
    default: false
  },
  must_change_password: {
    type: Boolean,
    default: false
  },
  
  // Status
  is_active: {
    type: Boolean,
    default: true
  },
  
  // Audit fields
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
userSchema.index({ tenant_id: 1, username: 1 }, { unique: true });
userSchema.index({ tenant_id: 1, email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ is_default_admin: 1 });
userSchema.index({ is_active: 1 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.fullName || this.username;
});

// Timestamp middleware (combined with password hashing)
userSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema); 