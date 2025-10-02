// Post Routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const logger = require('../config/logger');
const { postLimiter } = require('../config/rate-limit');

// Create post (with rate limiting)
router.post('/', auth, postLimiter, [
    body('content')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Post must be 1-500 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    
    try {
        const post = new Post({
            author: req.user._id,
            content: req.body.content,
            parentPost: req.body.parentPost || null
        });
        
        await post.save();
        await post.populate('author', 'username bio');
        
        // If reply, add to parent's replies array
        if (req.body.parentPost) {
            await Post.findByIdAndUpdate(
                req.body.parentPost,
                { $push: { replies: post._id } }
            );
        }
        
        // Broadcast new post via WebSocket
        const wsServer = req.app.get('wsServer');
        if (wsServer && !req.body.parentPost) {
            // Only broadcast top-level posts to feed
            wsServer.broadcastNewPost({
                _id: post._id,
                author: {
                    _id: post.author._id,
                    username: post.author.username
                },
                content: post.content,
                createdAt: post.createdAt
            });
        }
        
        logger.info(`Post created by user ${req.user._id}: ${post._id}`);
        
        res.status(201).json({ post });
        
    } catch (error) {
        logger.error(`Create post error: ${error.message}`);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Get feed (chronological)
router.get('/feed', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        // Get list of blocked and muted users to filter out
        const blockedUserIds = req.user.blockedUsers || [];
        const mutedUserIds = req.user.mutedUsers || [];
        const excludedUserIds = [...blockedUserIds, ...mutedUserIds];
        
        const posts = await Post.find({ 
            parentPost: null,
            author: { $nin: excludedUserIds } // Exclude blocked and muted users' posts
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username bio')
            .populate({
                path: 'replies',
                populate: { path: 'author', select: 'username bio' },
                options: { sort: { createdAt: 1 } }
            })
            .lean();
        
        const total = await Post.countDocuments({ 
            parentPost: null,
            author: { $nin: excludedUserIds }
        });
        
        res.json({
            posts,
            page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + posts.length < total
        });
        
    } catch (error) {
        logger.error(`Get feed error: ${error.message}`);
        res.status(500).json({ error: 'Failed to load feed' });
    }
});

// Get public posts (for unauthenticated users)
router.get('/public', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        
        const posts = await Post.find({ parentPost: null })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('author', 'username')
            .lean();
        
        res.json({ posts });
        
    } catch (error) {
        logger.error(`Get public posts error: ${error.message}`);
        res.status(500).json({ error: 'Failed to load posts' });
    }
});

// Get single post with replies
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username bio')
            .populate({
                path: 'replies',
                populate: { path: 'author', select: 'username bio' },
                options: { sort: { createdAt: 1 } }
            })
            .lean();
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json({ post });
        
    } catch (error) {
        logger.error(`Get post error: ${error.message}`);
        res.status(500).json({ error: 'Failed to load post' });
    }
});

// Edit post
router.put('/:id', auth, postLimiter, [
    body('content')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Post must be 1-500 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Check ownership
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to edit this post' });
        }
        
        // Check if post is within 5 minute edit window
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (post.createdAt < fiveMinutesAgo) {
            return res.status(403).json({ error: 'Edit window expired (5 minutes)' });
        }
        
        // Update post
        post.content = req.body.content;
        post.editedAt = new Date();
        await post.save();
        await post.populate('author', 'username bio');
        
        // Broadcast edit via WebSocket
        const wsServer = req.app.get('wsServer');
        if (wsServer) {
            wsServer.broadcastPostEdited({
                _id: post._id,
                content: post.content,
                editedAt: post.editedAt
            });
        }
        
        logger.info(`Post edited: ${post._id} by user ${req.user._id}`);
        
        res.json({ post });
        
    } catch (error) {
        logger.error(`Edit post error: ${error.message}`);
        res.status(500).json({ error: 'Failed to edit post' });
    }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Check ownership
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }
        
        // Delete post and all replies
        await Post.deleteMany({ parentPost: post._id });
        await post.deleteOne();
        
        // Broadcast deletion via WebSocket
        const wsServer = req.app.get('wsServer');
        if (wsServer) {
            wsServer.broadcastPostDeleted(post._id);
        }
        
        logger.info(`Post deleted: ${post._id} by user ${req.user._id}`);
        
        res.json({ message: 'Post deleted successfully' });
        
    } catch (error) {
        logger.error(`Delete post error: ${error.message}`);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Bookmark a post
router.post('/:postId/bookmark', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const user = await User.findById(req.user._id);
        
        // Check if already bookmarked
        if (user.bookmarkedPosts.includes(post._id)) {
            return res.status(400).json({ error: 'Post already bookmarked' });
        }
        
        user.bookmarkedPosts.push(post._id);
        await user.save();
        
        logger.info(`Post bookmarked: ${post._id} by user ${req.user._id}`);
        
        res.json({ message: 'Post bookmarked successfully' });
        
    } catch (error) {
        logger.error(`Bookmark post error: ${error.message}`);
        res.status(500).json({ error: 'Failed to bookmark post' });
    }
});

// Remove bookmark from a post
router.delete('/:postId/bookmark', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Remove post from bookmarks
        user.bookmarkedPosts = user.bookmarkedPosts.filter(
            postId => postId.toString() !== req.params.postId
        );
        await user.save();
        
        logger.info(`Bookmark removed: ${req.params.postId} by user ${req.user._id}`);
        
        res.json({ message: 'Bookmark removed successfully' });
        
    } catch (error) {
        logger.error(`Remove bookmark error: ${error.message}`);
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
});

// Get user's bookmarked posts
router.get('/bookmarks', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const user = await User.findById(req.user._id).populate({
            path: 'bookmarkedPosts',
            options: { 
                sort: { createdAt: -1 },
                skip: skip,
                limit: limit
            },
            populate: [
                { path: 'author', select: 'username bio' },
                {
                    path: 'replies',
                    populate: { path: 'author', select: 'username bio' },
                    options: { sort: { createdAt: 1 } }
                }
            ]
        });
        
        const total = user.bookmarkedPosts.length;
        
        res.json({
            posts: user.bookmarkedPosts,
            page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + user.bookmarkedPosts.length < total
        });
        
    } catch (error) {
        logger.error(`Get bookmarks error: ${error.message}`);
        res.status(500).json({ error: 'Failed to load bookmarks' });
    }
});

module.exports = router;
