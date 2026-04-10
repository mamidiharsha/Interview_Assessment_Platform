const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    technicalTimer: { type: Number, required: true, default: 1800 },
    codingTimer: { type: Number, required: true, default: 2700 },
    masterTimer: { type: Number, required: true, default: 5400 },
    isActive: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
