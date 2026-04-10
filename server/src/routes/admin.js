const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const Violation = require('../models/Violation');

const router = express.Router();

// Dashboard overview stats
router.get('/dashboard', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const totalCandidates = await User.countDocuments({ role: 'candidate' });
        const totalSubmissions = await Submission.countDocuments();
        const completedSubmissions = await Submission.countDocuments({ status: 'completed' });
        const terminatedSubmissions = await Submission.countDocuments({ status: 'terminated' });
        const inProgressSubmissions = await Submission.countDocuments({ status: 'in-progress' });

        // Average score
        const completedSubs = await Submission.find({ status: { $in: ['completed', 'terminated'] } });
        const avgScore = completedSubs.length > 0
            ? Math.round(completedSubs.reduce((sum, s) => sum + (s.score?.total || 0), 0) / completedSubs.length)
            : 0;

        // Section averages
        const avgTechnical = completedSubs.length > 0
            ? Math.round(completedSubs.reduce((sum, s) => sum + (s.score?.technical || 0), 0) / completedSubs.length)
            : 0;
        const avgCoding = completedSubs.length > 0
            ? Math.round(completedSubs.reduce((sum, s) => sum + (s.score?.coding || 0), 0) / completedSubs.length)
            : 0;

        const totalViolations = await Violation.countDocuments();

        res.json({
            totalCandidates,
            totalSubmissions,
            completedSubmissions,
            terminatedSubmissions,
            inProgressSubmissions,
            avgScore,
            avgTechnical,
            avgCoding,
            totalViolations
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Candidate list with submissions
router.get('/candidates', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const candidates = await User.find({ role: 'candidate' }).select('-password');
        const results = [];

        for (const candidate of candidates) {
            const submissions = await Submission.find({ userId: candidate._id })
                .populate('assessmentId', 'title');
            const violations = await Violation.countDocuments({ userId: candidate._id });

            results.push({
                ...candidate.toObject(),
                submissions,
                violationCount: violations
            });
        }

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

// Candidate detail with full data
router.get('/candidates/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const candidate = await User.findById(req.params.id).select('-password');
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        const submissions = await Submission.find({ userId: candidate._id })
            .populate('assessmentId');
        const violations = await Violation.find({ userId: candidate._id }).sort({ timestamp: -1 });

        // Get questions for each submission's assessment
        const submissionsWithQuestions = [];
        for (const sub of submissions) {
            const questions = await Question.find({ assessmentId: sub.assessmentId._id });
            submissionsWithQuestions.push({
                ...sub.toObject(),
                questions
            });
        }

        res.json({
            candidate,
            submissions: submissionsWithQuestions,
            violations
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch candidate details' });
    }
});

// Export results as CSV
router.get('/export', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { Parser } = require('json2csv');
        const submissions = await Submission.find({ status: { $in: ['completed', 'terminated'] } })
            .populate('userId', 'name email')
            .populate('assessmentId', 'title');

        const data = submissions.map(s => ({
            'Candidate Name': s.userId?.name || 'N/A',
            'Email': s.userId?.email || 'N/A',
            'Assessment': s.assessmentId?.title || 'N/A',
            'Status': s.status,
            'Technical Score': s.score?.technical || 0,
            'Coding Score': s.score?.coding || 0,
            'Total Score': s.score?.total || 0,
            'Start Time': s.startTime?.toISOString() || '',
            'End Time': s.endTime?.toISOString() || '',
            'Submitted At': s.updatedAt?.toISOString() || ''
        }));

        const parser = new Parser();
        const csv = parser.parse(data);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=assessment-results.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export results' });
    }
});

module.exports = router;
