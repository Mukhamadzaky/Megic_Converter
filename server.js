const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Setup Upload
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Database Setup (Users & Settings)
const db = new sqlite3.Database('./webp_converter.db');
db.serialize(() => {
    // Tabel History
    db.run(`CREATE TABLE IF NOT EXISTS conversions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        original_name TEXT,
        converted_name TEXT,
        format TEXT,
        size INTEGER,
        date TEXT
    )`);

    // Tabel Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        theme TEXT DEFAULT 'light',
        max_size_mb INTEGER DEFAULT 5
    )`);
});

// --- AUTH ROUTES ---

// 1. Register
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function(err) {
        if (err) return res.json({ success: false, message: "Username already exists" });
        res.json({ success: true });
    });
});

// 2. Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (!row) return res.json({ success: false, message: "Invalid credentials" });
        res.json({ success: true, user: row }); // Return user data (termasuk settings)
    });
});

// 3. Update Settings
app.post('/api/settings', (req, res) => {
    const { userId, theme, maxSize } = req.body;
    db.run("UPDATE users SET theme = ?, max_size_mb = ? WHERE id = ?", [theme, maxSize, userId], (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

// --- FILE ROUTES ---

// Upload dengan User ID
app.post('/api/save', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });
    const { originalName, format } = req.body;
    let { userId } = req.body;
    if (!userId) userId = null;
    const size = req.file.size;
    const date = new Date().toLocaleString();

    db.run("INSERT INTO conversions (user_id, original_name, converted_name, format, size, date) VALUES (?, ?, ?, ?, ?, ?)", 
        [userId, originalName, req.file.filename, format, size, date], 
        (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true, file: req.file.filename });
        }
    );
});

// --- HISTORY ---
// Return recent conversions (global). Frontend expects array of objects with
// fields: original_name, converted_name, format, size, date
app.get('/api/history', (req, res) => {
    db.all("SELECT id, user_id, original_name, converted_name, format, size, date FROM conversions ORDER BY id DESC LIMIT 50", [], (err, rows) => {
        if (err) return res.status(500).json([]);
        res.json(rows);
    });
});

// Get User Files (My Files)
app.get('/api/files/:userId', (req, res) => {
    db.all("SELECT * FROM conversions WHERE user_id = ? ORDER BY id DESC", [req.params.userId], (err, rows) => {
        res.json(rows);
    });
});

// Get Analytics
app.get('/api/analytics/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT 
            COUNT(*) as total_files,
            SUM(CASE WHEN format = 'JPG' THEN 1 ELSE 0 END) as total_jpg,
            SUM(CASE WHEN format = 'PNG' THEN 1 ELSE 0 END) as total_png,
            SUM(size) as total_size
        FROM conversions WHERE user_id = ?
    `;
    db.get(query, [userId], (err, row) => {
        res.json(row);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});