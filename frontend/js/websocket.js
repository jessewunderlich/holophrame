// Holophrame - WebSocket Client
// Real-time updates for feed

let ws = null;
let reconnectTimeout = null;
let isConnecting = false;

function initWebSocket() {
    if (!isAuthenticated() || isConnecting) {
        return;
    }
    
    isConnecting = true;
    const wsUrl = 'ws://localhost:3000';
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('WebSocket connected');
            isConnecting = false;
            
            // Authenticate
            const token = getAuthToken();
            ws.send(JSON.stringify({
                type: 'auth',
                token: token
            }));
            
            // Clear any reconnection timeout
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected');
            ws = null;
            isConnecting = false;
            
            // Attempt to reconnect after 5 seconds
            if (isAuthenticated()) {
                reconnectTimeout = setTimeout(() => {
                    console.log('Attempting to reconnect WebSocket...');
                    initWebSocket();
                }, 5000);
            }
        };
        
    } catch (error) {
        console.error('WebSocket initialization error:', error);
        isConnecting = false;
    }
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'auth_success':
            console.log('WebSocket authenticated');
            break;
            
        case 'auth_error':
            console.error('WebSocket authentication failed');
            break;
            
        case 'new_post':
            handleNewPost(data.post);
            break;
            
        case 'post_deleted':
            handlePostDeleted(data.postId);
            break;
            
        case 'post_edited':
            handlePostEdited(data.post);
            break;
            
        case 'new_message':
            // Handle incoming direct message
            if (typeof window.handleNewMessage === 'function') {
                window.handleNewMessage(data.message);
            }
            break;
            
        case 'notification':
            handleNotification(data.notification);
            break;
            
        case 'pong':
            // Heartbeat response
            break;
            
        default:
            console.log('Unknown WebSocket message type:', data.type);
    }
}

function handleNewPost(post) {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) return;
    
    // Check if we're on feed page
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Create post HTML
    const postHtml = `
        <div class="post" data-post-id="${post._id}" style="animation: fadeIn 0.3s;">
            <div class="post-header">
                <strong><a href="profile.html?user=${escapeHtml(post.author.username)}">${escapeHtml(post.author.username)}</a></strong>
                <span class="post-meta"> - ${formatDate(post.createdAt)}</span>
            </div>
            <div class="post-content">
                ${escapeHtml(post.content)}
            </div>
            <div class="post-actions">
                <a href="#" class="reply-link" data-post-id="${post._id}">Reply</a>
                 | <a href="#" class="bookmark-link" data-post-id="${post._id}">★ Bookmark</a>
                ${post.author._id === currentUser.id ? ` | <a href="#" class="edit-link" data-post-id="${post._id}">Edit</a> | <a href="#" class="delete-link" data-post-id="${post._id}">Delete</a>` : ''}
            </div>
        </div>
    `;
    
    // Insert new post at the top
    feedContainer.insertAdjacentHTML('afterbegin', postHtml);
    
    // Reattach event handlers for the new post
    if (typeof attachDeleteHandlers === 'function') {
        attachDeleteHandlers();
    }
    if (typeof attachReplyHandlers === 'function') {
        attachReplyHandlers();
    }
    if (typeof attachBookmarkHandlers === 'function') {
        attachBookmarkHandlers();
    }
    if (typeof attachEditHandlers === 'function') {
        attachEditHandlers();
    }
}

function handlePostDeleted(postId) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (postElement) {
        postElement.style.opacity = '0.5';
        const deleteMsg = document.createElement('p');
        deleteMsg.className = 'error';
        deleteMsg.textContent = 'This post has been deleted';
        postElement.appendChild(deleteMsg);
        
        setTimeout(() => {
            postElement.remove();
        }, 2000);
    }
}

function handlePostEdited(postData) {
    const postElement = document.querySelector(`[data-post-id="${postData._id}"]`);
    if (postElement) {
        const postContent = postElement.querySelector('.post-content');
        const postMeta = postElement.querySelector('.post-meta');
        
        if (postContent) {
            postContent.textContent = postData.content;
        }
        
        if (postMeta && postData.editedAt) {
            const editedText = document.createElement('span');
            editedText.className = 'edited-indicator';
            editedText.textContent = ' (edited)';
            postMeta.appendChild(editedText);
        }
    }
}

function handleNotification(notification) {
    // Update notification badge immediately
    if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
    }
    
    console.log('New notification:', notification);
}

function closeWebSocket() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
    ws = null;
}

// Heartbeat to keep connection alive
setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
    }
}, 30000);
