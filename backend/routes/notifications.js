// Notification Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../config/logger');

// Get user's notifications
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const user = await User.findById(req.user._id)
            .populate({
                path: 'notifications.from',
                select: 'username'
            })
            .populate({
                path: 'notifications.post',
                select: 'content createdAt'
            })
            .lean();
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Sort notifications by date (newest first) and paginate
        const sortedNotifications = user.notifications
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(skip, skip + limit);
        
        const total = user.notifications.length;
        
        res.json({
            notifications: sortedNotifications,
            page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + sortedNotifications.length < total
        });
        
    } catch (error) {
        logger.error(`Get notifications error: ${error.message}`);
        res.status(500).json({ error: 'Failed to load notifications' });
    }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('notifications');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const unreadCount = user.notifications.filter(n => !n.read).length;
        
        res.json({ count: unreadCount });
        
    } catch (error) {
        logger.error(`Get unread count error: ${error.message}`);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Mark notification as read
router.put('/:notificationId/read', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const notification = user.notifications.id(req.params.notificationId);
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        notification.read = true;
        await user.save();
        
        logger.info(`Notification marked as read: ${req.params.notificationId}`);
        
        res.json({ message: 'Notification marked as read' });
        
    } catch (error) {
        logger.error(`Mark notification read error: ${error.message}`);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.notifications.forEach(notification => {
            notification.read = true;
        });
        
        await user.save();
        
        logger.info(`All notifications marked as read for user ${req.user._id}`);
        
        res.json({ message: 'All notifications marked as read' });
        
    } catch (error) {
        logger.error(`Mark all notifications read error: ${error.message}`);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

// Delete a notification
router.delete('/:notificationId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.notifications = user.notifications.filter(
            n => n._id.toString() !== req.params.notificationId
        );
        
        await user.save();
        
        logger.info(`Notification deleted: ${req.params.notificationId}`);
        
        res.json({ message: 'Notification deleted' });
        
    } catch (error) {
        logger.error(`Delete notification error: ${error.message}`);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;
