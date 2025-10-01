// Message Model - Direct Messages between users
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000,
        trim: true
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound index for efficient conversation queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, read: 1 }); // For unread count

// Method to mark message as read
messageSchema.methods.markAsRead = async function() {
    this.read = true;
    return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(userId1, userId2, limit = 50) {
    return this.find({
        $or: [
            { sender: userId1, recipient: userId2 },
            { sender: userId2, recipient: userId1 }
        ]
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'username')
    .populate('recipient', 'username')
    .lean();
};

// Static method to get all conversations for a user
messageSchema.statics.getConversations = async function(userId) {
    // Aggregate to get latest message with each unique user
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const conversations = await this.aggregate([
        {
            $match: {
                $or: [
                    { sender: userObjectId },
                    { recipient: userObjectId }
                ]
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ['$sender', userObjectId] },
                        '$recipient',
                        '$sender'
                    ]
                },
                lastMessage: { $first: '$$ROOT' }
            }
        },
        {
            $sort: { 'lastMessage.createdAt': -1 }
        }
    ]);

    return conversations;
};

// Static method to count unread messages for a user
messageSchema.statics.countUnread = async function(userId) {
    return this.countDocuments({
        recipient: userId,
        read: false
    });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
