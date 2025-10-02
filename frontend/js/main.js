// Holophrame - Main JavaScript
// Minimal client-side functionality

const API_BASE_URL = 'http://localhost:3000/api';

// Utility: Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('holophrameToken') !== null;
}

// Utility: Get auth token
function getAuthToken() {
    return localStorage.getItem('holophrameToken');
}

// Utility: Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('holophrameUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Utility: Save auth data
function saveAuthData(token, user) {
    localStorage.setItem('holophrameToken', token);
    localStorage.setItem('holophrameUser', JSON.stringify(user));
}

// Utility: Clear auth data
function clearAuthData() {
    localStorage.removeItem('holophrameToken');
    localStorage.removeItem('holophrameUser');
}

// Utility: Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Make API request
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // If token is invalid, clear auth data and redirect to login
            if (response.status === 401 && data.error?.includes('token')) {
                console.warn('Invalid token detected, clearing auth data');
                clearAuthData();
                window.location.href = 'login.html';
                return;
            }
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Load recent public posts on homepage
async function loadRecentPosts() {
    const container = document.querySelector('.post-preview');
    if (!container) return;
    
    try {
        const data = await apiRequest('/posts/public?limit=5');
        
        if (data.posts && data.posts.length > 0) {
            container.innerHTML = data.posts.map(post => `
                <div class="post">
                    <div class="post-header">
                        <strong><a href="profile.html?user=${escapeHtml(post.author.username)}">${escapeHtml(post.author.username)}</a></strong>
                        <span class="post-meta"> - ${formatDate(post.createdAt)}</span>
                    </div>
                    <div class="post-content">
                        ${escapeHtml(post.content)}
                    </div>
                </div>
            `).join('');
            
            container.innerHTML += '<p class="text-center"><a href="register.html">Join Holophrame</a> to see more and start posting.</p>';
        } else {
            container.innerHTML = '<p><em>No posts yet. Be the first to share!</em></p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Unable to load posts. Please try again later.</p>';
    }
}

// Update notification badge
async function updateNotificationBadge() {
    const badge = document.getElementById('unreadBadge');
    if (!badge || !isAuthenticated()) return;
    
    try {
        const data = await apiRequest('/notifications/unread-count');
        
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating notification badge:', error);
    }
}

// Update message badge
async function updateMessageBadge() {
    const badge = document.getElementById('messagesBadge');
    if (!badge || !isAuthenticated()) return;
    
    try {
        const data = await apiRequest('/messages/unread-count');
        
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating message badge:', error);
    }
}

// Update all badges
async function updateAllBadges() {
    await Promise.all([
        updateNotificationBadge(),
        updateMessageBadge()
    ]);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load recent posts if on homepage
    if (document.querySelector('.post-preview')) {
        loadRecentPosts();
    }
    
    // Update badges on authenticated pages
    if (isAuthenticated()) {
        updateAllBadges();
        // Refresh badges every 30 seconds
        setInterval(updateAllBadges, 30000);
    }
    
    // Redirect authenticated users away from public pages
    const publicPages = ['index.html', 'login.html', 'register.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (isAuthenticated() && publicPages.includes(currentPage)) {
        window.location.href = 'feed.html';
    }
});
