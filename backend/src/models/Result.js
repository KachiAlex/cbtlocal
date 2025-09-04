const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
	username: { type: String },
	userId: { type: String },
	examId: { type: String },
	examTitle: { type: String },
	score: { type: Number },
	total: { type: Number },
	percent: { type: Number },
	totalQuestions: { type: Number },
	correctAnswers: { type: Number },
	timeTaken: { type: Number },
	submittedAt: { type: Date },
	answers: { type: Array },
	questionOrder: { type: Array },
}, { timestamps: false, strict: false });

module.exports = mongoose.models.Result || mongoose.model('Result', ResultSchema); 