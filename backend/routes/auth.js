// Authentication Routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../config/logger');
const { authLimiter } = require('../config/rate-limit');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Register (with rate limiting)
router.post('/register', authLimiter, [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-20 characters, letters, numbers, and underscores only'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Bio must be 200 characters or less')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    
    const { username, email, password, bio } = req.body;
    
    try {
        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if (existingUser) {
            return res.status(400).json({
                error: existingUser.username === username
                    ? 'Username already taken'
                    : 'Email already registered'
            });
        }
        
        // Create user
        const user = new User({
            username,
            email,
            password,
            bio: bio || ''
        });
        
        await user.save();
        
        logger.info(`New user registered: ${username}`);
        
        // Return success without token - user must login
        res.status(201).json({
            message: 'Registration successful. Please login.',
            username: user.username
        });
        
    } catch (error) {
        logger.error(`Registration error: ${error.message}`);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login (with rate limiting)
router.post('/login', authLimiter, [
    body('username').trim().notEmpty().withMessage('Username required'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    
    const { username, password } = req.body;
    
    try {
        // Find user
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last active
        user.lastActive = new Date();
        await user.save();
        
        // Generate token
        const token = generateToken(user._id);
        
        logger.info(`User logged in: ${username}`);
        
        res.json({
            token,
            user: user.toPublicJSON()
        });
        
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
