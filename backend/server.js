// Holophrame Backend Server
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const helmet = require('helmet');
require('dotenv').config();

// Import configuration
const logger = require('./config/logger');
const validateEnv = require('./config/validate-env');
const requestLogger = require('./middleware/request-logger');
const { apiLimiter } = require('./config/rate-limit');

// Validate environment variables
const env = validateEnv();

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const WebSocketServer = require('./websocket');
let wsServer;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false,
}));

// CORS middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Rate limiting for all routes
app.use('/api/', apiLimiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holophrame')
.then(() => {
    logger.info('MongoDB connected successfully');
    // Initialize WebSocket server after DB connection
    wsServer = new WebSocketServer(server);
    app.set('wsServer', wsServer);
    logger.info('WebSocket server initialized');
})
.catch(err => {
    logger.error('MongoDB connection error: ' + err.message);
    logger.error('Please check your MONGODB_URI in .env file');
    process.exit(1);
});

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Holophrame API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            posts: '/api/posts',
            users: '/api/users',
            messages: '/api/messages'
        }
    });
});

// Import and use route modules
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`);
    if (err.stack) {
        logger.debug(err.stack);
    }
    
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.info(`Holophrame server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API available at http://localhost:${PORT}/api`);
    logger.info(`CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:8080'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    logger.info(`${signal} received, closing server gracefully...`);
    
    server.close(() => {
        logger.info('HTTP server closed');
        
        if (wsServer) {
            wsServer.close();
            logger.info('WebSocket server closed');
        }
        
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
