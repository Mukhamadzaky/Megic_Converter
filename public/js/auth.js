// --- KONFIGURASI ---
const BASE_URL = 'http://localhost:3000';

// --- 1. FUNGSI LOGIN ---
function login() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    
    // Validasi Input
    if (!u || !p) {
        return alert("Mohon isi Username dan Password!");
    }

    // Kirim Data ke Backend
    fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            // Simpan User Session di LocalStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            // Redirect ke Dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Login Gagal! Cek username/password.');
        }
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Gagal menghubungi server.");
    });
}

// --- 2. FUNGSI REGISTER ---
function register() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    // Validasi Input
    if (!u || !p) {
        return alert("Mohon isi Username dan Password untuk mendaftar!");
    }

    // Kirim Data ke Backend
    fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            alert('Registrasi Berhasil! Silakan Login.');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Registrasi Gagal (Username mungkin sudah dipakai).');
        }
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Gagal menghubungi server.");
    });
}

// --- 3. FUNGSI LOGOUT ---
function logout() {
    // Hapus sesi user
    localStorage.removeItem('user');
    // Kembalikan ke halaman login
    window.location.href = 'login.html';
}

// --- 4. CEK OTENTIKASI (SESSION CHECKER) ---
// Fungsi ini dipanggil di halaman dashboard/myfiles/settings
// untuk memastikan user sudah login.
function checkAuth() {
    const userStr = localStorage.getItem('user');
    
    if(!userStr) {
        // Jika tidak ada data user, tendang ke login
        window.location.href = 'login.html';
        return null;
    }
    
    // Kembalikan data user (id, username, theme, dll)
    return JSON.parse(userStr);
}