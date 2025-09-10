const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
	id: { type: String, index: true },
	title: { type: String, required: true },
	description: { type: String },
	duration: { type: Number },
	questionCount: { type: Number },
	isActive: { type: Boolean },
	createdAt: { type: Date },
	updatedAt: { type: Date },
	questions: { type: Array },
}, { timestamps: false, strict: false });

module.exports = mongoose.models.Exam || mongoose.model('Exam', ExamSchema); 