const express = require('express');
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const Assessment = require('../models/Assessment');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Start or get existing submission
router.post('/start', authenticate, async (req, res) => {
    try {
        const { assessmentId } = req.body;
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
        if (!assessment.isActive) return res.status(400).json({ error: 'Assessment is not active' });

        // Check for existing in-progress submission
        let submission = await Submission.findOne({
            userId: req.user._id,
            assessmentId,
            status: 'in-progress'
        });

        if (submission) {
            return res.json(submission);
        }

        // Check for completed submission
        const completed = await Submission.findOne({
            userId: req.user._id,
            assessmentId,
            status: { $in: ['completed', 'terminated'] }
        });
        if (completed) {
            return res.status(400).json({ error: 'You have already completed this assessment' });
        }

        submission = await Submission.create({
            userId: req.user._id,
            assessmentId,
            startTime: new Date(),
            remainingMasterTime: assessment.masterTimer,
            remainingTechnicalTime: assessment.technicalTimer,
            remainingCodingTime: assessment.codingTimer
        });

        res.status(201).json(submission);
    } catch (err) {
        res.status(500).json({ error: 'Failed to start submission' });
    }
});

// Save technical answer
router.post('/:id/technical-answer', authenticate, async (req, res) => {
    try {
        const { questionId, answer } = req.body;
        const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id, status: 'in-progress' });
        if (!submission) return res.status(404).json({ error: 'Active submission not found' });

        submission.technicalAnswers.set(questionId, answer);
        await submission.save();
        res.json({ message: 'Answer saved' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save answer' });
    }
});

// Save coding answer
router.post('/:id/coding-answer', authenticate, async (req, res) => {
    try {
        const { questionId, code, language, results } = req.body;
        const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id, status: 'in-progress' });
        if (!submission) return res.status(404).json({ error: 'Active submission not found' });

        const existingIdx = submission.codingAnswers.findIndex(a => a.questionId.toString() === questionId);
        if (existingIdx >= 0) {
            submission.codingAnswers[existingIdx] = { questionId, code, language, results };
        } else {
            submission.codingAnswers.push({ questionId, code, language, results });
        }
        await submission.save();
        res.json({ message: 'Coding answer saved' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save coding answer' });
    }
});

// Toggle mark for review
router.post('/:id/toggle-review', authenticate, async (req, res) => {
    try {
        const { questionId } = req.body;
        const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id, status: 'in-progress' });
        if (!submission) return res.status(404).json({ error: 'Active submission not found' });

        const idx = submission.markedForReview.indexOf(questionId);
        if (idx >= 0) {
            submission.markedForReview.splice(idx, 1);
        } else {
            submission.markedForReview.push(questionId);
        }
        await submission.save();
        res.json({ markedForReview: submission.markedForReview });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle review' });
    }
});

// Sync timer
router.post('/:id/sync-timer', authenticate, async (req, res) => {
    try {
        const { remainingMasterTime, remainingTechnicalTime, remainingCodingTime } = req.body;
        const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id, status: 'in-progress' });
        if (!submission) return res.status(404).json({ error: 'Active submission not found' });

        if (remainingMasterTime !== undefined) submission.remainingMasterTime = remainingMasterTime;
        if (remainingTechnicalTime !== undefined) submission.remainingTechnicalTime = remainingTechnicalTime;
        if (remainingCodingTime !== undefined) submission.remainingCodingTime = remainingCodingTime;
        await submission.save();

        res.json({ message: 'Timer synced' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to sync timer' });
    }
});

// Submit assessment (final submit or auto-submit)
router.post('/:id/submit', authenticate, async (req, res) => {
    try {
        const { reason } = req.body;
        const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id, status: 'in-progress' });
        if (!submission) return res.status(404).json({ error: 'Active submission not found' });

        // Calculate score
        const questions = await Question.find({ assessmentId: submission.assessmentId });
        let technicalScore = 0;
        let codingScore = 0;

        // Score technical questions
        for (const q of questions.filter(q => q.section === 'technical')) {
            const answer = submission.technicalAnswers.get(q._id.toString());
            if (answer !== undefined && q.type === 'mcq' && answer === q.correctAnswer) {
                technicalScore += q.points;
            }
            // Theory questions need manual review, score = 0 for now
        }

        // Score coding questions
        for (const ca of submission.codingAnswers) {
            const q = questions.find(q => q._id.toString() === ca.questionId.toString());
            if (q && ca.results) {
                const percentage = ca.results.total > 0 ? ca.results.passed / ca.results.total : 0;
                codingScore += Math.round(q.points * percentage);
            }
        }

        submission.status = reason === 'terminated' ? 'terminated' : 'completed';
        submission.endTime = new Date();
        submission.score = {
            technical: technicalScore,
            coding: codingScore,
            total: technicalScore + codingScore
        };
        await submission.save();

        res.json({ message: 'Assessment submitted', score: submission.score, status: submission.status });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit assessment' });
    }
});

// Get submission status
router.get('/:id', authenticate, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) return res.status(404).json({ error: 'Submission not found' });
        res.json(submission);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch submission' });
    }
});

module.exports = router;
