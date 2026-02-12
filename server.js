const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Setup Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Folder public bisa diakses browser

// 1. Setup Folder Upload
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Konfigurasi Multer (Penyimpanan File)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nama file unik: timestamp-namaasli.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 3. Setup Database SQLite
const db = new sqlite3.Database('./webp_converter.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS conversions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_name TEXT,
        converted_name TEXT,
        format TEXT,
        date TEXT
    )`);
});

// --- ROUTES ---

// API: Upload Hasil Konversi
app.post('/api/save', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });

    const originalName = req.body.originalName; // Dikirim dari frontend
    const format = req.body.format;
    const filename = req.file.filename;
    const date = new Date().toLocaleString();

    db.run("INSERT INTO conversions (original_name, converted_name, format, date) VALUES (?, ?, ?, ?)", 
        [originalName, filename, format, date], 
        function(err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, file: filename });
        }
    );
});

// API: Ambil Riwayat
app.get('/api/history', (req, res) => {
    db.all("SELECT * FROM conversions ORDER BY id DESC", [], (err, rows) => {
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});