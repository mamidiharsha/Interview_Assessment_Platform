const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
    type: {
        type: String,
        enum: ['tab-switch', 'multiple-faces', 'no-face', 'suspicious-audio', 'fullscreen-exit', 'devtools', 'copy-paste'],
        required: true
    },
    details: { type: String, default: '' },
    snapshot: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Violation', violationSchema);
