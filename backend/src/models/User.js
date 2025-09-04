const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
	username: { type: String, required: true, index: true },
	email: { type: String },
	password: { type: String },
	role: { type: String, default: 'student' },
	fullName: { type: String },
	registeredAt: { type: Date },
	createdAt: { type: Date },
	updatedAt: { type: Date },
	// Admin hierarchy fields
	isDefaultAdmin: { type: Boolean, default: false },
	createdBy: { type: String }, // username of the admin who created this user
	canDeleteDefaultAdmin: { type: Boolean, default: false }, // only default admin can delete other admins
}, { timestamps: false, strict: false });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema); 