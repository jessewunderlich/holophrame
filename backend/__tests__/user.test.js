// User Model Tests
const User = require('../models/User');
require('./setup');

describe('User Model', () => {
    test('should create a valid user', async () => {
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            bio: 'Test bio'
        };
        
        const user = new User(userData);
        await user.save();
        
        expect(user._id).toBeDefined();
        expect(user.username).toBe(userData.username);
        expect(user.email).toBe(userData.email);
        expect(user.password).not.toBe(userData.password); // Should be hashed
        expect(user.bio).toBe(userData.bio);
    });
    
    test('should hash password before saving', async () => {
        const user = new User({
            username: 'testuser2',
            email: 'test2@example.com',
            password: 'plaintext'
        });
        
        await user.save();
        expect(user.password).not.toBe('plaintext');
        expect(user.password.length).toBeGreaterThan(20); // Bcrypt hash length
    });
    
    test('should compare passwords correctly', async () => {
        const password = 'mypassword123';
        const user = new User({
            username: 'testuser3',
            email: 'test3@example.com',
            password
        });
        
        await user.save();
        
        const isMatch = await user.comparePassword(password);
        expect(isMatch).toBe(true);
        
        const isNotMatch = await user.comparePassword('wrongpassword');
        expect(isNotMatch).toBe(false);
    });
    
    test('should return public JSON without sensitive data', async () => {
        const user = new User({
            username: 'testuser4',
            email: 'test4@example.com',
            password: 'password123'
        });
        
        await user.save();
        
        const publicData = user.toPublicJSON();
        expect(publicData.username).toBe('testuser4');
        expect(publicData.password).toBeUndefined();
        expect(publicData.email).toBeUndefined();
        expect(publicData.id).toBeDefined();
    });
    
    test('should enforce username validation', async () => {
        const user = new User({
            username: 'ab', // Too short
            email: 'test@example.com',
            password: 'password123'
        });
        
        await expect(user.save()).rejects.toThrow();
    });
    
    test('should enforce email validation', async () => {
        const user = new User({
            username: 'testuser5',
            email: 'invalid-email', // Invalid format
            password: 'password123'
        });
        
        await expect(user.save()).rejects.toThrow();
    });
});
