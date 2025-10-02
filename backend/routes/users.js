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

// Block user
router.post('/block/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Can't block yourself
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }
        
        // Check if user exists
        const userToBlock = await User.findById(userId);
        if (!userToBlock) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if already blocked
        if (req.user.blockedUsers.includes(userId)) {
            return res.status(400).json({ error: 'User already blocked' });
        }
        
        // Add to blocked users
        req.user.blockedUsers.push(userId);
        await req.user.save();
        
        logger.info(`User ${req.user._id} blocked user ${userId}`);
        
        res.json({ message: 'User blocked successfully' });
        
    } catch (error) {
        logger.error(`Block user error: ${error.message}`);
        res.status(500).json({ error: 'Failed to block user' });
    }
});

// Unblock user
router.delete('/block/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Remove from blocked users
        req.user.blockedUsers = req.user.blockedUsers.filter(
            id => id.toString() !== userId
        );
        await req.user.save();
        
        logger.info(`User ${req.user._id} unblocked user ${userId}`);
        
        res.json({ message: 'User unblocked successfully' });
        
    } catch (error) {
        logger.error(`Unblock user error: ${error.message}`);
        res.status(500).json({ error: 'Failed to unblock user' });
    }
});

// Mute user
router.post('/mute/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Can't mute yourself
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot mute yourself' });
        }
        
        // Check if user exists
        const userToMute = await User.findById(userId);
        if (!userToMute) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if already muted
        if (req.user.mutedUsers.includes(userId)) {
            return res.status(400).json({ error: 'User already muted' });
        }
        
        // Add to muted users
        req.user.mutedUsers.push(userId);
        await req.user.save();
        
        logger.info(`User ${req.user._id} muted user ${userId}`);
        
        res.json({ message: 'User muted successfully' });
        
    } catch (error) {
        logger.error(`Mute user error: ${error.message}`);
        res.status(500).json({ error: 'Failed to mute user' });
    }
});

// Unmute user
router.delete('/mute/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Remove from muted users
        req.user.mutedUsers = req.user.mutedUsers.filter(
            id => id.toString() !== userId
        );
        await req.user.save();
        
        logger.info(`User ${req.user._id} unmuted user ${userId}`);
        
        res.json({ message: 'User unmuted successfully' });
        
    } catch (error) {
        logger.error(`Unmute user error: ${error.message}`);
        res.status(500).json({ error: 'Failed to unmute user' });
    }
});

// Get blocked and muted users
router.get('/settings/blocked-muted', auth, async (req, res) => {
    try {
        await req.user.populate('blockedUsers', 'username');
        await req.user.populate('mutedUsers', 'username');
        
        res.json({
            blocked: req.user.blockedUsers,
            muted: req.user.mutedUsers
        });
        
    } catch (error) {
        logger.error(`Get blocked/muted error: ${error.message}`);
        res.status(500).json({ error: 'Failed to load settings' });
    }
});

module.exports = router;
