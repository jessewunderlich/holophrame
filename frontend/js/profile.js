// Holophrame - Profile Page JavaScript

const urlParams = new URLSearchParams(window.location.search);
const requestedUsername = urlParams.get('user');
const currentUser = getCurrentUser();

let isOwnProfile = false;

// Load profile data
async function loadProfile() {
    const profileContainer = document.getElementById('profileContainer');
    const username = requestedUsername || currentUser?.username;
    
    if (!username) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await apiRequest(`/users/${username}`);
        const { user, posts } = response;
        
        isOwnProfile = currentUser && user.username === currentUser.username;
        
        // Display profile
        profileContainer.innerHTML = `
            <div class="user-card">
                <h2>${escapeHtml(user.username)}</h2>
                <div class="user-info">
                    <p><strong>Bio:</strong> ${user.bio ? escapeHtml(user.bio) : '<em>No bio yet</em>'}</p>
                    <p class="timestamp">Joined ${formatDate(user.createdAt)}</p>
                    <p class="timestamp">Last active ${formatDate(user.lastActive)}</p>
                </div>
                <div class="profile-actions">
                    ${isOwnProfile ? '<button id="editProfileBtn">Edit Profile</button>' : `
                        <button id="blockBtn" data-user-id="${user._id}">Block User</button>
                        <button id="muteBtn" data-user-id="${user._id}">Mute User</button>
                    `}
                </div>
            </div>
        `;
        
        // Load user posts
        loadUserPosts(posts);
        
        // Attach edit handler if own profile
        if (isOwnProfile) {
            document.getElementById('editProfileBtn')?.addEventListener('click', showEditForm);
        } else {
            // Attach block/mute handlers
            document.getElementById('blockBtn')?.addEventListener('click', handleBlock);
            document.getElementById('muteBtn')?.addEventListener('click', handleMute);
        }
        
    } catch (error) {
        profileContainer.innerHTML = `
            <div class="error">
                <p><strong>Error:</strong> ${error.message || 'Failed to load profile'}</p>
                <p><a href="feed.html">Return to feed</a></p>
            </div>
        `;
    }
}

// Load user's posts
function loadUserPosts(posts) {
    const postsContainer = document.getElementById('userPostsContainer');
    
    if (posts && posts.length > 0) {
        postsContainer.innerHTML = posts.map(post => `
            <div class="post" data-post-id="${post._id}">
                <div class="post-header">
                    <span class="post-meta">${formatDate(post.createdAt)}</span>
                </div>
                <div class="post-content">
                    ${escapeHtml(post.content)}
                </div>
                <div class="post-actions">
                    <a href="post.html?id=${post._id}">View Thread</a>
                    ${isOwnProfile ? ` | <a href="#" class="delete-link" data-post-id="${post._id}">Delete</a>` : ''}
                </div>
            </div>
        `).join('');
        
        // Attach delete handlers
        if (isOwnProfile) {
            attachDeleteHandlers();
        }
    } else {
        postsContainer.innerHTML = '<p><em>No posts yet.</em></p>';
    }
}

// Show edit profile form
function showEditForm() {
    const editContainer = document.getElementById('editProfileContainer');
    const bioTextarea = document.getElementById('bio');
    const bioCharCount = document.getElementById('bioCharCount');
    
    bioTextarea.value = currentUser.bio || '';
    bioCharCount.textContent = bioTextarea.value.length;
    
    editContainer.classList.remove('hidden');
    
    // Scroll to form
    editContainer.scrollIntoView({ behavior: 'smooth' });
}

// Character counter for bio
document.getElementById('bio')?.addEventListener('input', (e) => {
    document.getElementById('bioCharCount').textContent = e.target.value.length;
});

// Handle profile edit
document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bio = document.getElementById('bio').value;
    
    try {
        const response = await apiRequest('/users/profile', {
            method: 'PATCH',
            body: JSON.stringify({ bio })
        });
        
        // Update stored user
        const updatedUser = { ...currentUser, bio };
        localStorage.setItem('holophrameUser', JSON.stringify(updatedUser));
        
        // Hide form and reload profile
        document.getElementById('editProfileContainer').classList.add('hidden');
        await loadProfile();
        
        alert('Profile updated successfully!');
        
    } catch (error) {
        alert('Failed to update profile: ' + error.message);
    }
});

// Cancel edit
document.getElementById('cancelEdit')?.addEventListener('click', () => {
    document.getElementById('editProfileContainer').classList.add('hidden');
});

// Handle post deletion
function attachDeleteHandlers() {
    document.querySelectorAll('.delete-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to delete this post?')) {
                return;
            }
            
            const postId = e.target.getAttribute('data-post-id');
            
            try {
                await apiRequest(`/posts/${postId}`, {
                    method: 'DELETE'
                });
                
                // Remove from DOM
                document.querySelector(`[data-post-id="${postId}"]`).remove();
                
            } catch (error) {
                alert('Failed to delete post: ' + error.message);
            }
        });
    });
}

// Handle block user
async function handleBlock(e) {
    const userId = e.target.getAttribute('data-user-id');
    const username = requestedUsername;
    
    if (!confirm(`Block ${username}? They won't be able to see your posts or message you.`)) {
        return;
    }
    
    try {
        await apiRequest(`/users/block/${userId}`, {
            method: 'POST'
        });
        
        alert(`${username} has been blocked.`);
        window.location.href = 'feed.html';
        
    } catch (error) {
        alert('Failed to block user: ' + error.message);
    }
}

// Handle mute user
async function handleMute(e) {
    const userId = e.target.getAttribute('data-user-id');
    const username = requestedUsername;
    
    if (!confirm(`Mute ${username}? You won't see their posts in your feed.`)) {
        return;
    }
    
    try {
        await apiRequest(`/users/mute/${userId}`, {
            method: 'POST'
        });
        
        alert(`${username} has been muted.`);
        window.location.href = 'feed.html';
        
    } catch (error) {
        alert('Failed to mute user: ' + error.message);
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
    
    loadProfile();
});
