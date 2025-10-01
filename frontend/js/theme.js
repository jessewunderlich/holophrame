// Dark Mode Toggle Functionality

// Initialize theme on page load
function initializeTheme() {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('holophrameTheme');
    
    if (savedTheme) {
        // Use saved preference
        document.body.className = savedTheme;
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.className = 'dark-mode';
        } else {
            document.body.className = 'light-mode';
        }
    }
    
    updateToggleButton();
}

// Toggle between light and dark mode
function toggleTheme() {
    const currentTheme = document.body.className;
    const newTheme = currentTheme === 'dark-mode' ? 'light-mode' : 'dark-mode';
    
    document.body.className = newTheme;
    localStorage.setItem('holophrameTheme', newTheme);
    
    updateToggleButton();
}

// Update toggle button text
function updateToggleButton() {
    const button = document.getElementById('theme-toggle');
    if (button) {
        const isDark = document.body.className === 'dark-mode';
        button.textContent = isDark ? 'LIGHT MODE' : 'DARK MODE';
    }
}

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only apply system preference if user hasn't manually set a preference
        if (!localStorage.getItem('holophrameTheme')) {
            document.body.className = e.matches ? 'dark-mode' : 'light-mode';
            updateToggleButton();
        }
    });
}

// Initialize theme when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}
