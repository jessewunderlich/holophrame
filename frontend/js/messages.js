// Holophrame - Messages JavaScript
// Direct messaging functionality

let currentConversationUser = null;
let messagePollingInterval = null;

// Load conversations list
async function loadConversations() {
    const conversationsContainer = document.getElementById('conversationsContainer');
    
    if (!conversationsContainer) return;
    
    conversationsContainer.innerHTML = '<p class="loading">Loading conversations...</p>';
    
    try {
        const data = await apiRequest('/messages/conversations');
        
        if (data.conversations && data.conversations.length > 0) {
            const conversationsHtml = data.conversations.map(conv => {
                const unreadBadge = conv.unreadCount > 0 
                    ? `<span class="unread-badge">${conv.unreadCount}</span>`
                    : '';
                
                const preview = conv.lastMessage.content.length > 50
                    ? conv.lastMessage.content.substring(0, 50) + '...'
                    : conv.lastMessage.content;
                
                const timeAgo = formatDate(conv.lastMessage.createdAt);
                
                return `
                    <div class="conversation-item" data-user-id="${conv.user._id}" onclick="openConversation('${conv.user._id}', '${escapeHtml(conv.user.username)}')">
                        <div class="conversation-header">
                            <strong>${escapeHtml(conv.user.username)}</strong>
                            ${unreadBadge}
                        </div>
                        <div class="conversation-preview">
                            <span class="message-preview">${conv.lastMessage.isFromMe ? 'You: ' : ''}${escapeHtml(preview)}</span>
                            <span class="message-time">${timeAgo}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            conversationsContainer.innerHTML = conversationsHtml;
        } else {
            conversationsContainer.innerHTML = '<p><em>No messages yet. Search for a user to start a conversation!</em></p>';
        }
        
    } catch (error) {
        conversationsContainer.innerHTML = '<p class="error">Failed to load conversations.</p>';
    }
}

// Open conversation with specific user
async function openConversation(userId, username) {
    currentConversationUser = { id: userId, username };
    
    // Hide conversations list, show conversation view
    document.getElementById('conversationsList').classList.add('hidden');
    document.getElementById('conversationView').classList.remove('hidden');
    
    // Update header
    document.getElementById('conversationUsername').textContent = username;
    document.getElementById('conversationUsername').href = `profile.html?user=${username}`;
    
    // Load messages
    await loadConversationMessages(userId);
    
    // Start polling for new messages (backup for WebSocket)
    startMessagePolling(userId);
    
    // Focus message input
    document.getElementById('messageContent').focus();
}

// Load messages for current conversation
async function loadConversationMessages(userId) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '<p class="loading">Loading messages...</p>';
    
    try {
        const data = await apiRequest(`/messages/conversation/${userId}`);
        
        if (data.messages && data.messages.length > 0) {
            displayMessages(data.messages);
        } else {
            messagesContainer.innerHTML = '<p><em>No messages yet. Start the conversation!</em></p>';
        }
        
        // Scroll to bottom
        scrollToBottom();
        
        // Update message badge (messages marked as read on backend)
        if (typeof updateMessageBadge === 'function') {
            setTimeout(updateMessageBadge, 500);
        }
        
    } catch (error) {
        messagesContainer.innerHTML = '<p class="error">Failed to load messages.</p>';
    }
}

// Display messages in conversation
function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    const currentUser = getCurrentUser();
    
    const messagesHtml = messages.map(msg => {
        const isFromMe = msg.sender._id === currentUser.id;
        const messageClass = isFromMe ? 'message message-sent' : 'message message-received';
        
        return `
            <div class="${messageClass}" data-message-id="${msg._id}">
                <div class="message-header">
                    <strong>${escapeHtml(msg.sender.username)}</strong>
                    <span class="message-time">${formatDate(msg.createdAt)}</span>
                </div>
                <div class="message-content">
                    ${escapeHtml(msg.content)}
                </div>
            </div>
        `;
    }).join('');
    
    messagesContainer.innerHTML = messagesHtml;
}

// Add single message to conversation
function addMessageToConversation(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    const currentUser = getCurrentUser();
    
    // Check if empty state message exists
    const emptyMessage = messagesContainer.querySelector('p em');
    if (emptyMessage) {
        messagesContainer.innerHTML = '';
    }
    
    const isFromMe = message.sender._id === currentUser.id;
    const messageClass = isFromMe ? 'message message-sent' : 'message message-received';
    
    const messageHtml = `
        <div class="${messageClass}" data-message-id="${message._id}">
            <div class="message-header">
                <strong>${escapeHtml(message.sender.username)}</strong>
                <span class="message-time">${formatDate(message.createdAt)}</span>
            </div>
            <div class="message-content">
                ${escapeHtml(message.content)}
            </div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

// Send message
document.getElementById('sendMessageForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentConversationUser) return;
    
    const messageInput = document.getElementById('messageContent');
    const content = messageInput.value.trim();
    
    if (!content) {
        alert('Message cannot be empty.');
        return;
    }
    
    try {
        const data = await apiRequest('/messages/send', {
            method: 'POST',
            body: JSON.stringify({
                recipientId: currentConversationUser.id,
                content
            })
        });
        
        // Clear input
        messageInput.value = '';
        document.getElementById('charCount').textContent = '0';
        
        // Add message to conversation
        addMessageToConversation(data.message);
        
    } catch (error) {
        alert('Failed to send message: ' + error.message);
    }
});

// Character counter
const messageContent = document.getElementById('messageContent');
const charCount = document.getElementById('charCount');

messageContent?.addEventListener('input', () => {
    charCount.textContent = messageContent.value.length;
});

// Back to conversations list
document.getElementById('backToList')?.addEventListener('click', () => {
    stopMessagePolling();
    currentConversationUser = null;
    
    document.getElementById('conversationView').classList.add('hidden');
    document.getElementById('conversationsList').classList.remove('hidden');
    
    // Reload conversations to update unread counts
    loadConversations();
});

// Start new conversation
document.getElementById('newConversationBtn')?.addEventListener('click', () => {
    const username = prompt('Enter username to message:');
    if (!username) return;
    
    // Search for user first
    searchUserAndStartConversation(username);
});

async function searchUserAndStartConversation(username) {
    try {
        const data = await apiRequest(`/users/search/${encodeURIComponent(username)}`);
        
        if (data.users && data.users.length > 0) {
            const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
            
            if (user) {
                openConversation(user._id, user.username);
            } else {
                alert('User not found. Try searching from the Search page.');
            }
        } else {
            alert('User not found.');
        }
    } catch (error) {
        alert('Failed to search for user: ' + error.message);
    }
}

// Scroll to bottom of messages
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Poll for new messages (backup for WebSocket)
function startMessagePolling(userId) {
    stopMessagePolling();
    
    messagePollingInterval = setInterval(async () => {
        if (currentConversationUser && currentConversationUser.id === userId) {
            try {
                const data = await apiRequest(`/messages/conversation/${userId}`);
                if (data.messages) {
                    // Only update if we have new messages
                    const messagesContainer = document.getElementById('messagesContainer');
                    const currentMessageIds = Array.from(messagesContainer.querySelectorAll('.message'))
                        .map(el => el.dataset.messageId);
                    
                    const newMessages = data.messages.filter(msg => !currentMessageIds.includes(msg._id));
                    
                    if (newMessages.length > 0) {
                        newMessages.forEach(msg => addMessageToConversation(msg));
                    }
                }
            } catch (error) {
                console.error('Message polling error:', error);
            }
        }
    }, 5000); // Poll every 5 seconds
}

function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
    }
}

// Handle WebSocket messages
function handleNewMessage(message) {
    // If we're viewing this conversation, add the message
    if (currentConversationUser && message.sender._id === currentConversationUser.id) {
        addMessageToConversation(message);
        
        // Mark as read
        apiRequest(`/messages/mark-read/${message.sender._id}`, {
            method: 'PUT'
        }).catch(err => console.error('Failed to mark as read:', err));
    } else {
        // Show notification or update conversations list
        loadConversations();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('conversationsContainer')) {
        loadConversations();
    }
    
    // Listen for WebSocket messages
    if (typeof initWebSocket === 'function') {
        // WebSocket message handler will be added via websocket.js
        window.handleNewMessage = handleNewMessage;
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopMessagePolling();
});
