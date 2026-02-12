const user = checkAuth();

// Load current settings
document.getElementById('theme-select').value = user.theme || 'light';
document.getElementById('size-limit').value = user.max_size_mb || 5;

function saveSettings() {
    const newTheme = document.getElementById('theme-select').value;
    const newLimit = document.getElementById('size-limit').value;
    
    fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, theme: newTheme, maxSize: newLimit })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            // Update Local Storage
            user.theme = newTheme;
            user.max_size_mb = newLimit;
            localStorage.setItem('user', JSON.stringify(user));
            alert('Settings Saved! Refresh to see changes.');
        }
    });
}