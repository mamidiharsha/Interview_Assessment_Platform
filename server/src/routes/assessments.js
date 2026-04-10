const express = require('express');
const Assessment = require('../models/Assessment');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all active assessments (for candidates)
router.get('/', authenticate, async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { isActive: true };
        const assessments = await Assessment.find(filter).populate('createdBy', 'name email');
        res.json(assessments);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch assessments' });
    }
});

// Get single assessment
router.get('/:id', authenticate, async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id).populate('createdBy', 'name email');
        if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
        res.json(assessment);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch assessment' });
    }
});

// Create assessment (admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const assessment = await Assessment.create({
            ...req.body,
            createdBy: req.user._id
        });
        res.status(201).json(assessment);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create assessment' });
    }
});

// Update assessment (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
        res.json(assessment);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update assessment' });
    }
});

// Toggle active status (admin only)
router.patch('/:id/toggle', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
        assessment.isActive = !assessment.isActive;
        await assessment.save();
        res.json(assessment);
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle assessment' });
    }
});

// Delete assessment (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        await Assessment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Assessment deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete assessment' });
    }
});

module.exports = router;
