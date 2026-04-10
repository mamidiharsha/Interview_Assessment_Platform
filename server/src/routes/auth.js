const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            role: role || 'candidate'
        });

        res.status(201).json({ message: 'User registered successfully', userId: user._id });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Prevent multiple logins for candidates
        if (user.role === 'candidate' && user.activeSession) {
            return res.status(403).json({ error: 'Account is already logged in from another session' });
        }

        const sessionId = uuidv4();
        user.activeSession = sessionId;
        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role, sessionId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { activeSession: null });
        res.clearCookie('token');
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Session check
router.get('/me', authenticate, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
        }
    });
});

module.exports = router;
