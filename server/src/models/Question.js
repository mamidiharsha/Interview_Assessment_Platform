const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
}, { _id: true });

const questionSchema = new mongoose.Schema({
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    type: { type: String, enum: ['mcq', 'theory', 'coding'], required: true },
    section: { type: String, enum: ['technical', 'coding'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    options: [{ type: String }],
    correctAnswer: { type: Number },
    constraints: { type: String, default: '' },
    sampleInput: { type: String, default: '' },
    sampleOutput: { type: String, default: '' },
    testCases: [testCaseSchema],
    points: { type: Number, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
