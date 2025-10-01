// HTTP Request Logger Middleware
const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
    // Log the incoming request
    logger.http(`${req.method} ${req.path}`);
    
    // Capture the start time
    const start = Date.now();
    
    // Log the response after it's sent
    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
        
        if (res.statusCode >= 500) {
            logger.error(message);
        } else if (res.statusCode >= 400) {
            logger.warn(message);
        } else {
            logger.http(message);
        }
    });
    
    next();
};

module.exports = requestLogger;
