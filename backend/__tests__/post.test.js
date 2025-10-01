// Post Model Tests
const Post = require('../models/Post');
const User = require('../models/User');
const { createTestUser } = require('./setup');

describe('Post Model', () => {
    let testUser;
    
    beforeEach(async () => {
        testUser = await createTestUser(User);
    });
    
    test('should create a valid post', async () => {
        const postData = {
            author: testUser._id,
            content: 'This is a test post'
        };
        
        const post = new Post(postData);
        await post.save();
        
        expect(post._id).toBeDefined();
        expect(post.content).toBe(postData.content);
        expect(post.author.toString()).toBe(testUser._id.toString());
        expect(post.createdAt).toBeDefined();
    });
    
    test('should enforce content length validation', async () => {
        const longContent = 'a'.repeat(501); // 501 characters
        
        const post = new Post({
            author: testUser._id,
            content: longContent
        });
        
        await expect(post.save()).rejects.toThrow();
    });
    
    test('should allow 500 character posts', async () => {
        const maxContent = 'a'.repeat(500);
        
        const post = new Post({
            author: testUser._id,
            content: maxContent
        });
        
        await post.save();
        expect(post.content.length).toBe(500);
    });
    
    test('should support post threading with parentPost', async () => {
        const parentPost = new Post({
            author: testUser._id,
            content: 'Parent post'
        });
        await parentPost.save();
        
        const replyPost = new Post({
            author: testUser._id,
            content: 'Reply post',
            parentPost: parentPost._id
        });
        await replyPost.save();
        
        expect(replyPost.parentPost.toString()).toBe(parentPost._id.toString());
    });
    
    test('should maintain replies array', async () => {
        const post = new Post({
            author: testUser._id,
            content: 'Post with replies'
        });
        await post.save();
        
        const reply1 = new Post({
            author: testUser._id,
            content: 'Reply 1',
            parentPost: post._id
        });
        await reply1.save();
        
        post.replies.push(reply1._id);
        await post.save();
        
        expect(post.replies.length).toBe(1);
        expect(post.replies[0].toString()).toBe(reply1._id.toString());
    });
});
