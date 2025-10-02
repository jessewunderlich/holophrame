// Auth Routes Tests
const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const User = require('../models/User');
require('./setup');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
    describe('POST /api/auth/register', () => {
        test('should register a new user', async () => {
            const userData = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'password123',
                bio: 'New user bio'
            };
            
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);
            
            expect(response.body.message).toBe('Registration successful. Please login.');
            expect(response.body.username).toBe(userData.username);
            expect(response.body.token).toBeUndefined(); // No token on registration
        });
        
        test('should reject duplicate username', async () => {
            const userData = {
                username: 'duplicate',
                email: 'first@example.com',
                password: 'password123'
            };
            
            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);
            
            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...userData, email: 'second@example.com' })
                .expect(400);
            
            expect(response.body.error).toContain('Username already taken');
        });
        
        test('should validate input fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'ab', // Too short
                    email: 'invalid',
                    password: 'short'
                })
                .expect(400);
            
            expect(response.body.error).toBeDefined();
        });
    });
    
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create test user
            const user = new User({
                username: 'logintest',
                email: 'login@example.com',
                password: 'password123'
            });
            await user.save();
        });
        
        test('should login with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'logintest',
                    password: 'password123'
                })
                .expect(200);
            
            expect(response.body.token).toBeDefined();
            expect(response.body.user.username).toBe('logintest');
        });
        
        test('should reject incorrect password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'logintest',
                    password: 'wrongpassword'
                })
                .expect(401);
            
            expect(response.body.error).toContain('Invalid credentials');
        });
        
        test('should reject non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'password123'
                })
                .expect(401);
            
            expect(response.body.error).toContain('Invalid credentials');
        });
    });
});
