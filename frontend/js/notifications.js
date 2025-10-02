// Notifications Page Logic

let currentPage = 1;
let hasMore = false;
let isLoading = false;

// Load notifications
async function loadNotifications(page = 1) {
    if (isLoading) return;
    isLoading = true;

    try {
        const data = await apiRequest(`/notifications?page=${page}&limit=20`);
        
        const container = document.getElementById('notificationsContainer');
        const emptyState = document.getElementById('emptyState');
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        
        if (data.notifications.length === 0 && page === 1) {
            emptyState.style.display = 'block';
            container.innerHTML = '';
            loadMoreContainer.style.display = 'none';
            return;
        }
        
        emptyState.style.display = 'none';
        
        if (page === 1) {
            container.innerHTML = '';
        }
        
        data.notifications.forEach(notification => {
            const notificationElement = createNotificationElement(notification);
            container.appendChild(notificationElement);
        });
        
        currentPage = data.page;
        hasMore = data.hasMore;
        
        loadMoreContainer.style.display = hasMore ? 'block' : 'none';
        
        // Update unread badge
        updateUnreadBadge();
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        alert('Failed to load notifications');
    } finally {
        isLoading = false;
    }
}

// Create notification element
function createNotificationElement(notification) {
    const div = document.createElement('div');
    div.className = 'notification-item' + (notification.read ? '' : ' unread');
    div.dataset.notificationId = notification._id;
    
    const icon = notification.type === 'reply' ? '💬' : '📢';
    
    let message = '';
    if (notification.type === 'reply') {
        message = `<strong>${escapeHtml(notification.from.username)}</strong> replied to your post`;
    } else if (notification.type === 'mention') {
        message = `<strong>${escapeHtml(notification.from.username)}</strong> mentioned you`;
    }
    
    const timeAgo = formatDate(notification.createdAt);
    
    div.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <div class="notification-text">
                <p>${message}</p>
                <p class="notification-time">${timeAgo}</p>
                ${notification.post && notification.post.content ? `
                    <p class="notification-preview">"${escapeHtml(notification.post.content.substring(0, 100))}${notification.post.content.length > 100 ? '...' : ''}"</p>
                ` : ''}
            </div>
        </div>
        <div class="notification-actions">
            <a href="feed.html?post=${notification.post._id}">VIEW POST</a>
            ${!notification.read ? ` | <a href="#" class="mark-read-link" data-notification-id="${notification._id}">MARK READ</a>` : ''}
             | <a href="#" class="delete-notification-link" data-notification-id="${notification._id}">DELETE</a>
        </div>
    `;
    
    // Attach handlers
    const markReadLink = div.querySelector('.mark-read-link');
    if (markReadLink) {
        markReadLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleMarkRead(notification._id, div);
        });
    }
    
    const deleteLink = div.querySelector('.delete-notification-link');
    deleteLink.addEventListener('click', (e) => {
        e.preventDefault();
        handleDeleteNotification(notification._id, div);
    });
    
    return div;
}

// Handle mark as read
async function handleMarkRead(notificationId, element) {
    try {
        await apiRequest(`/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
        
        element.classList.remove('unread');
        const markReadLink = element.querySelector('.mark-read-link');
        if (markReadLink) {
            markReadLink.remove();
        }
        
        updateUnreadBadge();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
        alert('Failed to mark notification as read');
    }
}

// Handle mark all as read
async function handleMarkAllRead() {
    try {
        await apiRequest('/notifications/read-all', {
            method: 'PUT'
        });
        
        // Update UI
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            const markReadLink = item.querySelector('.mark-read-link');
            if (markReadLink) {
                markReadLink.remove();
            }
        });
        
        updateUnreadBadge();
        
    } catch (error) {
        console.error('Error marking all as read:', error);
        alert('Failed to mark all as read');
    }
}

// Handle delete notification
async function handleDeleteNotification(notificationId, element) {
    if (!confirm('Delete this notification?')) {
        return;
    }
    
    try {
        await apiRequest(`/notifications/${notificationId}`, {
            method: 'DELETE'
        });
        
        element.style.opacity = '0';
        setTimeout(() => {
            element.remove();
            
            const container = document.getElementById('notificationsContainer');
            if (container.children.length === 0) {
                document.getElementById('emptyState').style.display = 'block';
            }
        }, 300);
        
        updateUnreadBadge();
        
    } catch (error) {
        console.error('Error deleting notification:', error);
        alert('Failed to delete notification');
    }
}

// Update unread badge
async function updateUnreadBadge() {
    try {
        const data = await apiRequest('/notifications/unread-count');
        const badge = document.getElementById('unreadBadge');
        
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating unread badge:', error);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Setup logout
    document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // Load notifications
    loadNotifications(1);
    
    // Setup load more button
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        loadNotifications(currentPage + 1);
    });
    
    // Setup mark all as read button
    document.getElementById('markAllReadBtn').addEventListener('click', handleMarkAllRead);
});
