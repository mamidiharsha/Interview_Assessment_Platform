const express = require('express');
const Violation = require('../models/Violation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Log a violation
router.post('/', authenticate, async (req, res) => {
    try {
        const { assessmentId, submissionId, type, details, snapshot } = req.body;
        const violation = await Violation.create({
            userId: req.user._id,
            assessmentId,
            submissionId,
            type,
            details,
            snapshot
        });

        // Count violations for this submission
        const count = await Violation.countDocuments({
            userId: req.user._id,
            submissionId
        });

        res.status(201).json({ violation, totalViolations: count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to log violation' });
    }
});

// Get violations for a submission
router.get('/submission/:submissionId', authenticate, async (req, res) => {
    try {
        const violations = await Violation.find({ submissionId: req.params.submissionId })
            .sort({ timestamp: -1 });
        res.json(violations);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch violations' });
    }
});

module.exports = router;
