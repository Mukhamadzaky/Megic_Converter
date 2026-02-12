const user = checkAuth(); // Dari auth.js
document.getElementById('user-display').innerText = user.username;

// Terapkan tema
if(user.theme === 'dark') {
    document.body.classList.add('dark-mode'); // Anda perlu buat CSS dark mode
}

let fileToUpload = null;

document.getElementById('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    
    // Validasi Ukuran (User Setting)
    const limit = (user.max_size_mb || 5) * 1024 * 1024;
    if(file.size > limit) return alert(`File too big! Max: ${user.max_size_mb}MB`);
    
    // Preview Logic...
    fileToUpload = file;
    // ... code preview ...
});

function processConversion() {
    // Logic Canvas Convert sama seperti sebelumnya ...
    
    // Saat upload, kirim User ID
    canvas.toBlob(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'converted.jpg');
        formData.append('userId', user.id); // PENTING: Kirim ID User
        formData.append('originalName', fileToUpload.name);
        formData.append('format', 'JPG');
        
        fetch('/api/save', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if(data.success) alert('Saved to My Files!');
        });
    }, 'image/jpeg');
}