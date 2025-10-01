// Test setup and utilities
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.NODE_ENV = 'test';

// Setup in-memory MongoDB for tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

// Clear database between tests
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});

// Cleanup after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

module.exports = {
    // Helper to create test user
    createTestUser: async (User, userData = {}) => {
        const defaultUser = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            bio: 'Test bio'
        };
        
        const user = new User({ ...defaultUser, ...userData });
        await user.save();
        return user;
    },
    
    // Helper to generate JWT token
    generateTestToken: (jwt, userId) => {
        return jwt.sign(
            { id: userId },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    }
};
