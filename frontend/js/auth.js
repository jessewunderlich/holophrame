// Holophrame - Authentication JavaScript

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        saveAuthData(data.token, data.user);
        
        messageDiv.className = 'success';
        messageDiv.textContent = 'Login successful! Redirecting...';
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            window.location.href = 'feed.html';
        }, 1000);
        
    } catch (error) {
        messageDiv.className = 'error';
        messageDiv.textContent = error.message || 'Login failed. Please check your credentials.';
        messageDiv.classList.remove('hidden');
    }
});

// Handle registration form submission
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const bio = document.getElementById('bio').value;
    const messageDiv = document.getElementById('message');
    
    // Validate password match
    if (password !== confirmPassword) {
        messageDiv.className = 'error';
        messageDiv.textContent = 'Passwords do not match.';
        messageDiv.classList.remove('hidden');
        return;
    }
    
    try {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, bio })
        });
        
        // Clear any existing auth data before redirecting to login
        clearAuthData();
        
        messageDiv.className = 'success';
        messageDiv.textContent = 'Account created successfully! Redirecting to login...';
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        
    } catch (error) {
        messageDiv.className = 'error';
        messageDiv.textContent = error.message || 'Registration failed. Please try again.';
        messageDiv.classList.remove('hidden');
    }
});

// Protect authenticated pages
document.addEventListener('DOMContentLoaded', () => {
    const protectedPages = ['feed.html', 'profile.html', 'messages.html', 'search.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (protectedPages.includes(currentPage) && !isAuthenticated()) {
        window.location.href = 'login.html';
    }
});
