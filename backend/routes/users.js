// User Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const logger = require('../config/logger');

// Get user profile
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-password -email')
            .lean();
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get user's posts
        const posts = await Post.find({ author: user._id, parentPost: null })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('author', 'username')
            .lean();
        
        res.json({ user, posts });
        
    } catch (error) {
        logger.error(`Get user error: ${error.message}`);
        res.status(500).json({ error: 'Failed to load user profile' });
    }
});

// Search users
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        const users = await User.find({
            username: { $regex: query, $options: 'i' }
        })
        .select('username bio createdAt')
        .limit(20)
        .lean();
        
        res.json({ users });
        
    } catch (error) {
        logger.error(`Search users error: ${error.message}`);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Update profile
router.patch('/profile', auth, async (req, res) => {
    try {
        const { bio } = req.body;
        
        if (bio !== undefined) {
            if (bio.length > 200) {
                return res.status(400).json({ error: 'Bio must be 200 characters or less' });
            }
            req.user.bio = bio;
        }
        
        await req.user.save();
        
        logger.info(`Profile updated: ${req.user._id}`);
        
        res.json({ user: req.user.toPublicJSON() });
        
    } catch (error) {
        logger.error(`Update profile error: ${error.message}`);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
