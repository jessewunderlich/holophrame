// Holophrame - Feed JavaScript

let currentPage = 1;
const postsPerPage = 20;

// Character counter for post creation
const postContent = document.getElementById('postContent');
const charCount = document.getElementById('charCount');

postContent?.addEventListener('input', () => {
    charCount.textContent = postContent.value.length;
});

// Handle post creation
document.getElementById('createPostForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const content = postContent.value.trim();
    
    if (!content) {
        alert('Post content cannot be empty.');
        return;
    }
    
    try {
        await apiRequest('/posts', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        
        // Clear form
        postContent.value = '';
        charCount.textContent = '0';
        
        // Reload feed
        currentPage = 1;
        await loadFeed();
        
    } catch (error) {
        alert('Failed to create post: ' + error.message);
    }
});

// Load feed posts
async function loadFeed(append = false) {
    const feedContainer = document.getElementById('feedContainer');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    if (!append) {
        feedContainer.innerHTML = '<p class="loading">Loading posts...</p>';
    }
    
    try {
        const data = await apiRequest(`/posts/feed?page=${currentPage}&limit=${postsPerPage}`);
        
        if (data.posts && data.posts.length > 0) {
            const postsHtml = data.posts.map(post => {
                // Generate HTML for replies
                const repliesHtml = post.replies && post.replies.length > 0 
                    ? post.replies.map(reply => `
                        <div class="post reply" style="margin-left: 30px; border-left: 3px solid var(--border-secondary); padding-left: 15px;" data-post-id="${reply._id}">
                            <div class="post-header">
                                <strong><a href="profile.html?user=${escapeHtml(reply.author.username)}">${escapeHtml(reply.author.username)}</a></strong>
                                <span class="post-meta"> - ${formatDate(reply.createdAt)}${reply.editedAt ? ' <span class="edited-indicator">(edited)</span>' : ''}</span>
                            </div>
                            <div class="post-content">
                                ${escapeHtml(reply.content)}
                            </div>
                            ${reply.author._id === getCurrentUser()?.id ? `
                            <div class="post-actions">
                                ${canEdit(reply.createdAt) ? `<a href="#" class="edit-link" data-post-id="${reply._id}">Edit</a> | ` : ''}
                                <a href="#" class="delete-link" data-post-id="${reply._id}">Delete</a>
                            </div>` : ''}
                        </div>
                    `).join('')
                    : '';
                
                return `
                    <div class="post" data-post-id="${post._id}">
                        <div class="post-header">
                            <strong><a href="profile.html?user=${escapeHtml(post.author.username)}">${escapeHtml(post.author.username)}</a></strong>
                            <span class="post-meta"> - ${formatDate(post.createdAt)}${post.editedAt ? ' <span class="edited-indicator">(edited)</span>' : ''}</span>
                        </div>
                        <div class="post-content">
                            ${escapeHtml(post.content)}
                        </div>
                        <div class="post-actions">
                            <a href="#" class="reply-link" data-post-id="${post._id}">Reply</a>
                            ${post.author._id === getCurrentUser()?.id ? ` | ${canEdit(post.createdAt) ? `<a href="#" class="edit-link" data-post-id="${post._id}">Edit</a> | ` : ''}<a href="#" class="delete-link" data-post-id="${post._id}">Delete</a>` : ''}
                             | <a href="#" class="bookmark-link" data-post-id="${post._id}">★ Bookmark</a>
                        </div>
                        ${repliesHtml}
                    </div>
                `;
            }).join('');
            
            if (append) {
                feedContainer.innerHTML += postsHtml;
            } else {
                feedContainer.innerHTML = postsHtml;
            }
            
            // Show/hide load more button
            if (data.hasMore) {
                loadMoreContainer.classList.remove('hidden');
            } else {
                loadMoreContainer.classList.add('hidden');
            }
            
            // Attach delete handlers
            attachDeleteHandlers();
            // Attach reply handlers
            attachReplyHandlers();
            // Attach edit handlers
            attachEditHandlers();
            // Attach bookmark handlers
            attachBookmarkHandlers();
            
        } else if (!append) {
            feedContainer.innerHTML = '<p><em>No posts yet. Be the first to share something!</em></p>';
            loadMoreContainer.classList.add('hidden');
        }
        
    } catch (error) {
        feedContainer.innerHTML = '<p class="error">Failed to load feed. Please try again.</p>';
        loadMoreContainer.classList.add('hidden');
    }
}

// Handle load more
document.getElementById('loadMoreBtn')?.addEventListener('click', async () => {
    currentPage++;
    await loadFeed(true);
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
                
                // Remove post from DOM
                document.querySelector(`[data-post-id="${postId}"]`).remove();
                
            } catch (error) {
                alert('Failed to delete post: ' + error.message);
            }
        });
    });
}

// Handle reply buttons
function attachReplyHandlers() {
    document.querySelectorAll('.reply-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const postId = e.target.getAttribute('data-post-id');
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            
            // Check if reply form already exists
            let replyForm = postElement.querySelector('.reply-form');
            if (replyForm) {
                replyForm.remove();
                return;
            }
            
            // Create reply form
            replyForm = document.createElement('div');
            replyForm.className = 'reply-form';
            replyForm.innerHTML = `
                <textarea class="reply-content" placeholder="Write your reply..." maxlength="500"></textarea>
                <div class="reply-actions">
                    <button type="button" class="post-reply-btn">Post Reply</button>
                    <button type="button" class="cancel-reply-btn">Cancel</button>
                    <span class="char-count">0/500</span>
                </div>
            `;
            
            postElement.appendChild(replyForm);
            
            const textarea = replyForm.querySelector('.reply-content');
            const charCountSpan = replyForm.querySelector('.char-count');
            const postBtn = replyForm.querySelector('.post-reply-btn');
            const cancelBtn = replyForm.querySelector('.cancel-reply-btn');
            
            // Character counter
            textarea.addEventListener('input', () => {
                charCountSpan.textContent = `${textarea.value.length}/500`;
            });
            
            // Focus textarea
            textarea.focus();
            
            // Cancel button
            cancelBtn.addEventListener('click', () => {
                replyForm.remove();
            });
            
            // Post reply button
            postBtn.addEventListener('click', async () => {
                const content = textarea.value.trim();
                
                if (!content) {
                    alert('Reply cannot be empty.');
                    return;
                }
                
                try {
                    postBtn.disabled = true;
                    postBtn.textContent = 'Posting...';
                    
                    await apiRequest('/posts', {
                        method: 'POST',
                        body: JSON.stringify({ content, parentPost: postId })
                    });
                    
                    replyForm.remove();
                    
                    // Show replies inline under the parent post
                    const replyHtml = `
                        <div class="post reply" style="margin-left: 30px; border-left: 3px solid var(--border-secondary); padding-left: 15px;">
                            <div class="post-header">
                                <strong><a href="profile.html?user=${escapeHtml(getCurrentUser().username)}">${escapeHtml(getCurrentUser().username)}</a></strong>
                                <span class="post-meta"> - just now</span>
                            </div>
                            <div class="post-content">
                                ${escapeHtml(content)}
                            </div>
                        </div>
                    `;
                    postElement.insertAdjacentHTML('afterend', replyHtml);
                    
                } catch (error) {
                    alert('Failed to post reply: ' + error.message);
                    postBtn.disabled = false;
                    postBtn.textContent = 'Post Reply';
                }
            });
        });
    });
}

// Check if post can be edited (within 5 minute window)
function canEdit(createdAt) {
    const fiveMinutes = 5 * 60 * 1000;
    const postTime = new Date(createdAt).getTime();
    const now = Date.now();
    return (now - postTime) < fiveMinutes;
}

// Handle edit buttons
function attachEditHandlers() {
    document.querySelectorAll('.edit-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const postId = e.target.getAttribute('data-post-id');
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            const postContent = postElement.querySelector('.post-content');
            const originalContent = postContent.textContent.trim();
            
            // Check if already editing
            if (postElement.querySelector('.edit-form')) {
                return;
            }
            
            // Create edit form
            const editForm = document.createElement('div');
            editForm.className = 'edit-form';
            editForm.innerHTML = `
                <textarea class="edit-content" maxlength="500">${originalContent}</textarea>
                <div class="edit-actions">
                    <button type="button" class="save-edit-btn">Save</button>
                    <button type="button" class="cancel-edit-btn">Cancel</button>
                    <span class="char-count">${originalContent.length}/500</span>
                </div>
            `;
            
            // Hide original content and insert edit form after it
            postContent.style.display = 'none';
            postContent.insertAdjacentElement('afterend', editForm);
            
            const textarea = editForm.querySelector('.edit-content');
            const charCountSpan = editForm.querySelector('.char-count');
            const saveBtn = editForm.querySelector('.save-edit-btn');
            const cancelBtn = editForm.querySelector('.cancel-edit-btn');
            
            // Character counter
            textarea.addEventListener('input', () => {
                charCountSpan.textContent = `${textarea.value.length}/500`;
            });
            
            // Focus textarea
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            
            // Cancel button
            cancelBtn.addEventListener('click', () => {
                editForm.remove();
                postContent.style.display = '';
            });
            
            // Save button
            saveBtn.addEventListener('click', async () => {
                const newContent = textarea.value.trim();
                
                if (!newContent) {
                    alert('Post content cannot be empty.');
                    return;
                }
                
                if (newContent === originalContent) {
                    // No changes, just cancel
                    cancelBtn.click();
                    return;
                }
                
                try {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Saving...';
                    
                    const response = await apiRequest(`/posts/${postId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ content: newContent })
                    });
                    
                    // Update content
                    postContent.textContent = newContent;
                    postContent.style.display = '';
                    editForm.remove();
                    
                    // Add edited indicator to meta if not already there
                    const postMeta = postElement.querySelector('.post-meta');
                    if (postMeta && !postMeta.querySelector('.edited-indicator')) {
                        const editedSpan = document.createElement('span');
                        editedSpan.className = 'edited-indicator';
                        editedSpan.textContent = ' (edited)';
                        postMeta.appendChild(editedSpan);
                    }
                    
                    // Remove edit link (edit window expired after first edit)
                    const editLink = postElement.querySelector('.edit-link');
                    if (editLink) {
                        editLink.remove();
                        // Remove the " | " before it
                        const actionsDiv = postElement.querySelector('.post-actions');
                        if (actionsDiv && actionsDiv.innerHTML.includes(' | <a')) {
                            actionsDiv.innerHTML = actionsDiv.innerHTML.replace(' | <a', '<a');
                        }
                    }
                    
                } catch (error) {
                    alert('Failed to edit post: ' + error.message);
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Save';
                }
            });
        });
    });
}

// Handle logout
document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
        clearAuthData();
        window.location.href = 'index.html';
    }
});

// Handle bookmark actions
function attachBookmarkHandlers() {
    document.querySelectorAll('.bookmark-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const postId = e.target.getAttribute('data-post-id');
            
            try {
                await apiRequest(`/posts/${postId}/bookmark`, {
                    method: 'POST'
                });
                
                // Update button text to show it's bookmarked
                e.target.textContent = '★ Bookmarked';
                e.target.style.color = 'var(--text-secondary)';
                
                // Show success message briefly
                const originalText = e.target.textContent;
                setTimeout(() => {
                    e.target.textContent = originalText;
                }, 1500);
                
            } catch (error) {
                if (error.message.includes('already bookmarked')) {
                    alert('This post is already in your bookmarks!');
                } else {
                    alert('Failed to bookmark post: ' + error.message);
                }
            }
        });
    });
}

// Initialize feed
document.addEventListener('DOMContentLoaded', () => {
    loadFeed();
    
    // Initialize WebSocket for real-time updates
    if (isAuthenticated()) {
        initWebSocket();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    closeWebSocket();
});
