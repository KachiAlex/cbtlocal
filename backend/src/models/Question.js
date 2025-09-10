const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
	id: { type: String, index: true },
	examId: { type: String, index: true }, // Add examId to link questions to specific exams
	text: { type: String },
	options: { type: Array },
	correctIndex: { type: Number },
	createdAt: { type: Date },
	updatedAt: { type: Date },
}, { timestamps: false, strict: false });

module.exports = mongoose.models.Question || mongoose.model('Question', QuestionSchema); 