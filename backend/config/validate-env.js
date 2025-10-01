// Environment Variable Validation with Joi
const Joi = require('joi');
const logger = require('./logger');

// Define validation schema
const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number()
        .default(3000),
    MONGODB_URI: Joi.string()
        .required()
        .description('MongoDB connection string is required'),
    JWT_SECRET: Joi.string()
        .min(32)
        .required()
        .description('JWT secret must be at least 32 characters'),
    JWT_EXPIRE: Joi.string()
        .default('7d'),
    CORS_ORIGIN: Joi.string()
        .default('http://localhost:8080'),
    RATE_LIMIT_WINDOW: Joi.number()
        .default(15),
    RATE_LIMIT_MAX_REQUESTS: Joi.number()
        .default(100),
    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'http', 'debug')
        .default('info'),
}).unknown(); // Allow other environment variables

// Validate environment variables
const validateEnv = () => {
    const { error, value } = envSchema.validate(process.env, {
        abortEarly: false,
    });

    if (error) {
        logger.error('Environment variable validation failed:');
        error.details.forEach((detail) => {
            logger.error(`  - ${detail.message}`);
        });
        
        // Don't exit in test environment
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    }

    return value;
};

module.exports = validateEnv;
