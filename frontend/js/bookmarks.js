// Bookmarks Page Logic

let currentPage = 1;
let hasMore = false;
let isLoading = false;

// Load bookmarked posts
async function loadBookmarks(page = 1) {
    if (isLoading) return;
    isLoading = true;

    try {
        const data = await apiRequest(`/posts/bookmarks?page=${page}&limit=20`);
        
        const container = document.getElementById('bookmarksContainer');
        const emptyState = document.getElementById('emptyState');
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        
        if (data.posts.length === 0 && page === 1) {
            emptyState.style.display = 'block';
            container.innerHTML = '';
            loadMoreContainer.style.display = 'none';
            return;
        }
        
        emptyState.style.display = 'none';
        
        if (page === 1) {
            container.innerHTML = '';
        }
        
        data.posts.forEach(post => {
            const postElement = createPostElement(post);
            container.appendChild(postElement);
        });
        
        currentPage = data.page;
        hasMore = data.hasMore;
        
        loadMoreContainer.style.display = hasMore ? 'block' : 'none';
        
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        alert('Failed to load bookmarks');
    } finally {
        isLoading = false;
    }
}

// Create post element
function createPostElement(post) {
    const article = document.createElement('article');
    article.className = 'post';
    
    const header = document.createElement('div');
    header.className = 'post-header';
    
    const authorLink = document.createElement('a');
    authorLink.href = `profile.html?user=${post.author.username}`;
    authorLink.textContent = `@${post.author.username}`;
    
    const timestamp = document.createElement('span');
    timestamp.textContent = ` • ${formatDate(post.createdAt)}`;
    
    header.appendChild(authorLink);
    header.appendChild(timestamp);
    
    const content = document.createElement('div');
    content.className = 'post-content';
    content.innerHTML = escapeHtml(post.content);
    
    // Check if post was edited
    if (post.editedAt) {
        const editedIndicator = document.createElement('span');
        editedIndicator.className = 'edited-indicator';
        editedIndicator.textContent = ' (edited)';
        content.appendChild(editedIndicator);
    }
    
    const actions = document.createElement('div');
    actions.className = 'post-actions';
    
    // Remove bookmark button
    const removeBookmarkBtn = document.createElement('button');
    removeBookmarkBtn.className = 'bookmark-btn bookmarked';
    removeBookmarkBtn.textContent = '★ REMOVE BOOKMARK';
    removeBookmarkBtn.onclick = () => handleRemoveBookmark(post._id, article);
    
    // Reply button
    const replyBtn = document.createElement('button');
    replyBtn.textContent = 'REPLY';
    replyBtn.onclick = () => window.location.href = `feed.html?post=${post._id}`;
    
    actions.appendChild(removeBookmarkBtn);
    actions.appendChild(replyBtn);
    
    article.appendChild(header);
    article.appendChild(content);
    article.appendChild(actions);
    
    // Add replies if any
    if (post.replies && post.replies.length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies-container';
        
        post.replies.forEach(reply => {
            const replyElement = createReplyElement(reply);
            repliesContainer.appendChild(replyElement);
        });
        
        article.appendChild(repliesContainer);
    }
    
    return article;
}

// Create reply element
function createReplyElement(reply) {
    const replyDiv = document.createElement('div');
    replyDiv.className = 'reply';
    
    const header = document.createElement('div');
    header.className = 'post-header';
    
    const authorLink = document.createElement('a');
    authorLink.href = `profile.html?user=${reply.author.username}`;
    authorLink.textContent = `@${reply.author.username}`;
    
    const timestamp = document.createElement('span');
    timestamp.textContent = ` • ${formatDate(reply.createdAt)}`;
    
    header.appendChild(authorLink);
    header.appendChild(timestamp);
    
    const content = document.createElement('div');
    content.className = 'post-content';
    content.innerHTML = escapeHtml(reply.content);
    
    if (reply.editedAt) {
        const editedIndicator = document.createElement('span');
        editedIndicator.className = 'edited-indicator';
        editedIndicator.textContent = ' (edited)';
        content.appendChild(editedIndicator);
    }
    
    replyDiv.appendChild(header);
    replyDiv.appendChild(content);
    
    return replyDiv;
}

// Handle remove bookmark
async function handleRemoveBookmark(postId, postElement) {
    if (!confirm('Remove this post from bookmarks?')) {
        return;
    }
    
    try {
        await apiRequest(`/posts/${postId}/bookmark`, {
            method: 'DELETE'
        });
        
        // Remove post element from DOM with fade effect
        postElement.style.opacity = '0';
        setTimeout(() => {
            postElement.remove();
            
            // Check if there are any posts left
            const container = document.getElementById('bookmarksContainer');
            if (container.children.length === 0) {
                document.getElementById('emptyState').style.display = 'block';
            }
        }, 300);
        
    } catch (error) {
        console.error('Error removing bookmark:', error);
        alert('Failed to remove bookmark');
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
    
    // Load bookmarks
    loadBookmarks(1);
    
    // Setup load more button
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        loadBookmarks(currentPage + 1);
    });
});
