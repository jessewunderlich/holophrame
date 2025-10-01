// Holophrame - Search Page JavaScript

// Handle search form
document.getElementById('searchForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const query = document.getElementById('searchQuery').value.trim();
    const searchResults = document.getElementById('searchResults');
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!query) {
        return;
    }
    
    resultsContainer.innerHTML = '<p class="loading">Searching...</p>';
    searchResults.classList.remove('hidden');
    
    try {
        const response = await apiRequest(`/users/search/${encodeURIComponent(query)}`);
        const { users } = response;
        
        if (users && users.length > 0) {
            resultsContainer.innerHTML = users.map(user => `
                <div class="user-card">
                    <h4><a href="profile.html?user=${escapeHtml(user.username)}">${escapeHtml(user.username)}</a></h4>
                    <p>${user.bio ? escapeHtml(user.bio) : '<em>No bio</em>'}</p>
                    <p class="timestamp">Joined ${formatDate(user.createdAt)}</p>
                </div>
            `).join('');
        } else {
            resultsContainer.innerHTML = '<p><em>No users found matching your search.</em></p>';
        }
        
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="error">
                <p><strong>Search failed:</strong> ${error.message}</p>
            </div>
        `;
    }
});

// Handle logout
document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
        clearAuthData();
        window.location.href = 'index.html';
    }
});

// Auto-focus search input
document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('searchQuery')?.focus();
});
