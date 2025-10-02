// Holophrame - Settings JavaScript
// Manage blocked and muted users

// Load blocked and muted users
async function loadBlockedMuted() {
    const blockedContainer = document.getElementById('blockedUsersContainer');
    const mutedContainer = document.getElementById('mutedUsersContainer');
    
    try {
        const data = await apiRequest('/users/settings/blocked-muted');
        
        // Display blocked users
        if (data.blocked && data.blocked.length > 0) {
            const blockedHtml = data.blocked.map(user => `
                <div class="user-item">
                    <strong><a href="profile.html?user=${escapeHtml(user.username)}">${escapeHtml(user.username)}</a></strong>
                    <button class="unblock-btn" data-user-id="${user._id}" data-username="${escapeHtml(user.username)}">Unblock</button>
                </div>
            `).join('');
            blockedContainer.innerHTML = blockedHtml;
            
            // Attach unblock handlers
            document.querySelectorAll('.unblock-btn').forEach(btn => {
                btn.addEventListener('click', handleUnblock);
            });
        } else {
            blockedContainer.innerHTML = '<p><em>No blocked users.</em></p>';
        }
        
        // Display muted users
        if (data.muted && data.muted.length > 0) {
            const mutedHtml = data.muted.map(user => `
                <div class="user-item">
                    <strong><a href="profile.html?user=${escapeHtml(user.username)}">${escapeHtml(user.username)}</a></strong>
                    <button class="unmute-btn" data-user-id="${user._id}" data-username="${escapeHtml(user.username)}">Unmute</button>
                </div>
            `).join('');
            mutedContainer.innerHTML = mutedHtml;
            
            // Attach unmute handlers
            document.querySelectorAll('.unmute-btn').forEach(btn => {
                btn.addEventListener('click', handleUnmute);
            });
        } else {
            mutedContainer.innerHTML = '<p><em>No muted users.</em></p>';
        }
        
    } catch (error) {
        blockedContainer.innerHTML = '<p class="error">Failed to load blocked users.</p>';
        mutedContainer.innerHTML = '<p class="error">Failed to load muted users.</p>';
    }
}

// Handle unblock
async function handleUnblock(e) {
    const userId = e.target.getAttribute('data-user-id');
    const username = e.target.getAttribute('data-username');
    
    if (!confirm(`Unblock ${username}?`)) {
        return;
    }
    
    try {
        await apiRequest(`/users/block/${userId}`, {
            method: 'DELETE'
        });
        
        // Reload list
        await loadBlockedMuted();
        
    } catch (error) {
        alert('Failed to unblock user: ' + error.message);
    }
}

// Handle unmute
async function handleUnmute(e) {
    const userId = e.target.getAttribute('data-user-id');
    const username = e.target.getAttribute('data-username');
    
    if (!confirm(`Unmute ${username}?`)) {
        return;
    }
    
    try {
        await apiRequest(`/users/mute/${userId}`, {
            method: 'DELETE'
        });
        
        // Reload list
        await loadBlockedMuted();
        
    } catch (error) {
        alert('Failed to unmute user: ' + error.message);
    }
}

// Handle logout
document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
        clearAuthData();
        window.location.href = 'index.html';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    loadBlockedMuted();
});
