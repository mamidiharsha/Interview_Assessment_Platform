const express = require('express');
const Question = require('../models/Question');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get questions for an assessment (candidates see no hidden test cases or correct answers)
router.get('/assessment/:assessmentId', authenticate, async (req, res) => {
    try {
        const { section } = req.query;
        const filter = { assessmentId: req.params.assessmentId };
        if (section) filter.section = section;

        let questions = await Question.find(filter);

        // Strip sensitive data for candidates
        if (req.user.role === 'candidate') {
            questions = questions.map(q => {
                const obj = q.toObject();
                delete obj.correctAnswer;
                if (obj.testCases) {
                    obj.testCases = obj.testCases.filter(tc => !tc.isHidden);
                }
                return obj;
            });
        }

        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Get single question
router.get('/:id', authenticate, async (req, res) => {
    try {
        let question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        if (req.user.role === 'candidate') {
            const obj = question.toObject();
            delete obj.correctAnswer;
            if (obj.testCases) {
                obj.testCases = obj.testCases.filter(tc => !tc.isHidden);
            }
            return res.json(obj);
        }

        res.json(question);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch question' });
    }
});

// Create question (admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const question = await Question.create(req.body);
        res.status(201).json(question);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create question' });
    }
});

// Update question (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!question) return res.status(404).json({ error: 'Question not found' });
        res.json(question);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update question' });
    }
});

// Delete question (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.json({ message: 'Question deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

module.exports = router;
