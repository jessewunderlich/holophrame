// Message Routes - Direct messaging system
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const logger = require('../config/logger');

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Message.getConversations(req.user.id);
        
        // Calculate unread count for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const otherUserId = conv._id;
                const unreadCount = await Message.countDocuments({
                    sender: otherUserId,
                    recipient: req.user.id,
                    read: false
                });
                
                // Get the other user's details
                const otherUser = await User.findById(otherUserId).select('username');
                if (!otherUser) {
                    return null; // Skip deleted users
                }
                
                const isFromMe = conv.lastMessage.sender.toString() === req.user.id.toString();
                
                return {
                    user: {
                        _id: otherUserId,
                        username: otherUser.username
                    },
                    lastMessage: {
                        content: conv.lastMessage.content,
                        createdAt: conv.lastMessage.createdAt,
                        isFromMe
                    },
                    unreadCount
                };
            })
        );
        
        // Filter out null entries (deleted users)
        const validConversations = conversationsWithUnread.filter(conv => conv !== null);
        
        res.json({ conversations: validConversations });
        
    } catch (error) {
        logger.error(`Get conversations error: ${error.message}`);
        res.status(500).json({ error: 'Failed to load conversations' });
    }
});

// Get conversation with specific user
router.get('/conversation/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if other user exists
        const otherUser = await User.findById(userId).select('username');
        if (!otherUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get messages
        const messages = await Message.getConversation(req.user.id, userId);
        
        // Mark messages as read (messages sent TO current user FROM other user)
        await Message.updateMany(
            {
                sender: userId,
                recipient: req.user.id,
                read: false
            },
            { read: true }
        );
        
        res.json({
            user: otherUser,
            messages: messages.reverse() // Oldest first for display
        });
        
    } catch (error) {
        logger.error(`Get conversation error: ${error.message}`);
        res.status(500).json({ error: 'Failed to load conversation' });
    }
});

// Send a message
router.post('/send', auth, [
    body('recipientId')
        .notEmpty()
        .withMessage('Recipient ID required')
        .isMongoId()
        .withMessage('Invalid recipient ID'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Message content required')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    
    const { recipientId, content } = req.body;
    
    try {
        // Can't send message to yourself
        if (recipientId === req.user.id) {
            return res.status(400).json({ error: 'Cannot send message to yourself' });
        }
        
        // Check if recipient exists
        const recipient = await User.findById(recipientId).select('username blockedUsers');
        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found' });
        }
        
        // Check if you are blocked by recipient
        if (recipient.blockedUsers && recipient.blockedUsers.includes(req.user.id)) {
            return res.status(403).json({ error: 'Cannot send message to this user' });
        }
        
        // Check if you have blocked the recipient
        if (req.user.blockedUsers && req.user.blockedUsers.includes(recipientId)) {
            return res.status(403).json({ error: 'You have blocked this user' });
        }
        
        // Create message
        const message = new Message({
            sender: req.user.id,
            recipient: recipientId,
            content
        });
        
        await message.save();
        
        // Populate sender info for response
        await message.populate('sender', 'username');
        
        logger.info(`Message sent from ${req.user.id} to ${recipientId}`);
        
        // Broadcast via WebSocket if available
        const wsServer = req.app.get('wsServer');
        if (wsServer) {
            wsServer.notifyUser(recipientId, {
                type: 'new_message',
                message: {
                    _id: message._id,
                    sender: {
                        _id: req.user.id,
                        username: message.sender.username
                    },
                    content: message.content,
                    createdAt: message.createdAt,
                    read: false
                }
            });
        }
        
        res.status(201).json({ message });
        
    } catch (error) {
        logger.error(`Send message error: ${error.message}`);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Message.countUnread(req.user.id);
        res.json({ count });
    } catch (error) {
        logger.error(`Get unread count error: ${error.message}`);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Mark conversation as read
router.put('/mark-read/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        await Message.updateMany(
            {
                sender: userId,
                recipient: req.user.id,
                read: false
            },
            { read: true }
        );
        
        res.json({ success: true });
        
    } catch (error) {
        logger.error(`Mark as read error: ${error.message}`);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

module.exports = router;
