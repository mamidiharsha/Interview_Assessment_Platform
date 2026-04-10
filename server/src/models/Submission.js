const mongoose = require('mongoose');

const codingAnswerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    results: {
        passed: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        executionTime: { type: Number, default: 0 },
        details: [{ type: mongoose.Schema.Types.Mixed }]
    }
}, { _id: true });

const submissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    technicalAnswers: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    codingAnswers: [codingAnswerSchema],
    markedForReview: [{ type: String }],
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    technicalStartTime: { type: Date },
    codingStartTime: { type: Date },
    remainingMasterTime: { type: Number },
    remainingTechnicalTime: { type: Number },
    remainingCodingTime: { type: Number },
    status: { type: String, enum: ['in-progress', 'completed', 'terminated'], default: 'in-progress' },
    score: {
        technical: { type: Number, default: 0 },
        coding: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
