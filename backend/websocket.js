// WebSocket Server for Real-time Updates
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('./config/logger');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map(); // userId -> Set of WebSocket connections
        
        this.wss.on('connection', (ws, req) => {
            logger.info('New WebSocket connection');
            
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });
            
            ws.on('message', (message) => {
                this.handleMessage(ws, message);
            });
            
            ws.on('close', () => {
                this.handleDisconnect(ws);
            });
            
            ws.on('error', (error) => {
                logger.error(`WebSocket error: ${error.message}`);
            });
        });
        
        // Heartbeat to detect broken connections
        this.heartbeat = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }
    
    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'auth':
                    this.authenticateClient(ws, data.token);
                    break;
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                    break;
                default:
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: 'Unknown message type' 
                    }));
            }
        } catch (error) {
            logger.error(`Error handling WebSocket message: ${error.message}`);
            ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Invalid message format' 
            }));
        }
    }
    
    authenticateClient(ws, token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            ws.userId = decoded.id;
            
            // Add to clients map
            if (!this.clients.has(ws.userId)) {
                this.clients.set(ws.userId, new Set());
            }
            this.clients.get(ws.userId).add(ws);
            
            ws.send(JSON.stringify({ 
                type: 'auth_success',
                message: 'Authenticated successfully'
            }));
            
            logger.info(`User ${ws.userId} authenticated via WebSocket`);
        } catch (error) {
            ws.send(JSON.stringify({ 
                type: 'auth_error',
                message: 'Authentication failed'
            }));
            ws.close();
        }
    }
    
    handleDisconnect(ws) {
        if (ws.userId && this.clients.has(ws.userId)) {
            this.clients.get(ws.userId).delete(ws);
            if (this.clients.get(ws.userId).size === 0) {
                this.clients.delete(ws.userId);
            }
            logger.info(`User ${ws.userId} disconnected`);
        }
    }
    
    // Broadcast new post to all connected clients
    broadcastNewPost(post) {
        const message = JSON.stringify({
            type: 'new_post',
            post
        });
        
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.userId) {
                client.send(message);
            }
        });
    }
    
    // Send notification to specific user
    notifyUser(userId, notification) {
        if (this.clients.has(userId)) {
            const message = JSON.stringify({
                type: 'notification',
                notification
            });
            
            this.clients.get(userId).forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(message);
                }
            });
        }
    }
    
    // Broadcast post deletion
    broadcastPostDeleted(postId) {
        const message = JSON.stringify({
            type: 'post_deleted',
            postId
        });
        
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.userId) {
                client.send(message);
            }
        });
    }
    
    // Broadcast post edit
    broadcastPostEdited(postData) {
        const message = JSON.stringify({
            type: 'post_edited',
            post: postData
        });
        
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.userId) {
                client.send(message);
            }
        });
    }
    
    close() {
        clearInterval(this.heartbeat);
        this.wss.close();
    }
}

module.exports = WebSocketServer;
