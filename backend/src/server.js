const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
require('dotenv').config();

// Models
const User = require('./models/User');
const Exam = require('./models/Exam');
const Result = require('./models/Result');
const Question = require('./models/Question');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
	res.status(200).json({ 
		status: 'healthy', 
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || 'development',
		database: process.env.DB_TYPE || 'mongodb'
	});
});

// API info
app.get('/api', (req, res) => {
	res.json({ 
		message: 'CBT Backend API is running',
		version: '1.0.0',
		database: process.env.DB_TYPE || 'mongodb',
		endpoints: {
			health: '/health',
			exams: '/api/exams',
			questions: '/api/questions',
			results: '/api/results',
			users: '/api/users'
		}
	});
});

// Read-only API routes
app.get('/api/exams', async (req, res, next) => {
	try {
		const items = await Exam.find({}).lean();
		res.json(items);
	} catch (err) { next(err); }
});

app.get('/api/questions', async (req, res, next) => {
	try {
		const items = await Question.find({}).lean();
		res.json(items);
	} catch (err) { next(err); }
});

app.get('/api/results', async (req, res, next) => {
	try {
		const items = await Result.find({}).lean();
		res.json(items);
	} catch (err) { next(err); }
});

app.get('/api/users', async (req, res, next) => {
	try {
		const items = await User.find({}).select('-password').lean();
		res.json(items);
	} catch (err) { next(err); }
});

// Authentication endpoint
app.post('/api/auth/login', async (req, res, next) => {
	try {
		const { username, password } = req.body;
		
		if (!username || !password) {
			return res.status(400).json({ error: 'Username and password are required' });
		}
		
		// Find user by username (case-insensitive)
		const user = await User.findOne({ 
			username: { $regex: new RegExp(`^${username}$`, 'i') }
		}).lean();
		
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}
		
		// Check password
		if (user.password !== password) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}
		
		// Return user data without password
		const { password: _, ...userData } = user;
		res.json(userData);
		
	} catch (err) { next(err); }
});

// Initialize admin user endpoint - only creates the default admin if no admin exists
app.post('/api/init-admin', async (req, res, next) => {
	try {
		// Check if any admin user exists
		const existingAdmin = await User.findOne({ role: 'admin' });
		
		if (existingAdmin) {
			return res.json({ 
				message: 'Admin user already exists',
				exists: true 
			});
		}
		
		// Create default admin user only if no admin exists
		const adminUser = new User({
			username: 'admin',
			password: 'admin123',
			role: 'admin',
			fullName: 'System Administrator',
			email: 'admin@healthschool.com',
			createdAt: new Date(),
			isDefaultAdmin: true,
			canDeleteDefaultAdmin: true
		});
		
		await adminUser.save();
		
		res.status(201).json({
			message: 'Default admin user created successfully',
			exists: false,
			user: {
				username: adminUser.username,
				role: adminUser.role,
				fullName: adminUser.fullName,
				email: adminUser.email,
				isDefaultAdmin: true
			}
		});
		
	} catch (err) { next(err); }
});

// Create new admin user (only default admin can do this)
app.post('/api/admin/create', async (req, res, next) => {
	try {
		const { username, password, fullName, email, requestingAdmin } = req.body;
		
		if (!username || !password || !fullName || !email || !requestingAdmin) {
			return res.status(400).json({ error: 'All fields are required' });
		}
		
		// Check if requesting user is the default admin
		const defaultAdmin = await User.findOne({ 
			username: requestingAdmin,
			isDefaultAdmin: true 
		});
		
		if (!defaultAdmin) {
			return res.status(403).json({ error: 'Only the default admin can create new admin users' });
		}
		
		// Check if username already exists
		const existingUser = await User.findOne({ 
			username: { $regex: new RegExp(`^${username}$`, 'i') }
		});
		
		if (existingUser) {
			return res.status(400).json({ error: 'Username already exists' });
		}
		
		// Create new admin user
		const newAdmin = new User({
			username,
			password,
			role: 'admin',
			fullName,
			email,
			createdAt: new Date(),
			isDefaultAdmin: false,
			createdBy: requestingAdmin,
			canDeleteDefaultAdmin: false
		});
		
		await newAdmin.save();
		
		res.status(201).json({
			message: 'Admin user created successfully',
			user: {
				username: newAdmin.username,
				role: newAdmin.role,
				fullName: newAdmin.fullName,
				email: newAdmin.email,
				isDefaultAdmin: false,
				createdBy: newAdmin.createdBy
			}
		});
		
	} catch (err) { next(err); }
});

// Delete admin user (only default admin can delete other admins)
app.delete('/api/admin/:username', async (req, res, next) => {
	try {
		const { username } = req.params;
		const { requestingAdmin } = req.body;
		
		if (!requestingAdmin) {
			return res.status(400).json({ error: 'Requesting admin username is required' });
		}
		
		// Check if requesting user is the default admin
		const defaultAdmin = await User.findOne({ 
			username: requestingAdmin,
			isDefaultAdmin: true 
		});
		
		if (!defaultAdmin) {
			return res.status(403).json({ error: 'Only the default admin can delete admin users' });
		}
		
		// Prevent deletion of the default admin
		if (username.toLowerCase() === 'admin') {
			return res.status(403).json({ error: 'Cannot delete the default admin user' });
		}
		
		// Find and delete the admin user
		const adminToDelete = await User.findOne({ 
			username: { $regex: new RegExp(`^${username}$`, 'i') },
			role: 'admin'
		});
		
		if (!adminToDelete) {
			return res.status(404).json({ error: 'Admin user not found' });
		}
		
		await User.findByIdAndDelete(adminToDelete._id);
		
		res.json({
			message: 'Admin user deleted successfully',
			deletedUser: {
				username: adminToDelete.username,
				fullName: adminToDelete.fullName
			}
		});
		
	} catch (err) { next(err); }
});

// Get all admin users (only default admin can see this)
app.get('/api/admin/list', async (req, res, next) => {
	try {
		const { requestingAdmin } = req.query;
		
		if (!requestingAdmin) {
			return res.status(400).json({ error: 'Requesting admin username is required' });
		}
		
		// Check if requesting user is the default admin
		const defaultAdmin = await User.findOne({ 
			username: requestingAdmin,
			isDefaultAdmin: true 
		});
		
		if (!defaultAdmin) {
			return res.status(403).json({ error: 'Only the default admin can view admin list' });
		}
		
		// Get all admin users
		const adminUsers = await User.find({ role: 'admin' })
			.select('-password')
			.lean();
		
		res.json(adminUsers);
		
	} catch (err) { next(err); }
});

// POST endpoints for creating/updating data
app.post('/api/users', async (req, res, next) => {
	try {
		const users = req.body;
		
		// Clear existing users and insert new ones
		await User.deleteMany({});
		
		// Insert all users (including admin)
		const createdUsers = await User.insertMany(users);
		
		res.status(201).json({
			message: 'Users updated successfully',
			count: createdUsers.length
		});
	} catch (err) { next(err); }
});

app.post('/api/exams', async (req, res, next) => {
	try {
		const exams = req.body;
		
		// Clear existing exams and insert new ones
		await Exam.deleteMany({});
		
		// Insert all exams
		const createdExams = await Exam.insertMany(exams);
		
		res.status(201).json({
			message: 'Exams updated successfully',
			count: createdExams.length
		});
	} catch (err) { next(err); }
});

app.post('/api/questions', async (req, res, next) => {
	try {
		const questions = req.body;
		
		// Clear existing questions and insert new ones
		await Question.deleteMany({});
		
		// Insert all questions
		const createdQuestions = await Question.insertMany(questions);
		
		res.status(201).json({
			message: 'Questions updated successfully',
			count: createdQuestions.length
		});
	} catch (err) { next(err); }
});

app.post('/api/results', async (req, res, next) => {
	try {
		const results = req.body;
		
		// Clear existing results and insert new ones
		await Result.deleteMany({});
		
		// Insert all results
		const createdResults = await Result.insertMany(results);
		
		res.status(201).json({
			message: 'Results updated successfully',
			count: createdResults.length
		});
	} catch (err) { next(err); }
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ 
		error: 'Something went wrong!',
		message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
	});
});

// 404 handler
app.use('*', (req, res) => {
	res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
	console.log(`🚀 CBT Backend server running on port ${PORT}`);
	console.log(`📊 Health check: http://localhost:${PORT}/health`);
	console.log(`🔗 API base: http://localhost:${PORT}/api`);
	console.log(`🗄️ Database: ${process.env.DB_TYPE || 'mongodb'}`);
});

module.exports = app; 