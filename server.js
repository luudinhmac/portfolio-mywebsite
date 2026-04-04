require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Configs
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname, { extensions: ['html'] })); // Phục vụ tĩnh folder này

// Upload config (Lưu vào bộ nhớ đệm để phân tích)
const upload = multer({ storage: multer.memoryStorage() });

// Database init
const pool = mysql.createPool({
    host: process.env.DB_HOST || '192.168.157.109',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'portfolio_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Khởi tạo bảng
async function initDB() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title TEXT NOT NULL,
            content LONGTEXT,
            category TEXT,
            series TEXT,
            is_pinned TINYINT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT,
            author_name TEXT,
            author_email TEXT,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
        )`);
        console.log("Connected to MariaDB database and tables initialized.");
    } catch (err) {
        console.error("Error initializing db:", err.message);
    }
}
initDB();

// Middleware xác thực JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Truy cập bị từ chối. Vui lòng đăng nhập.' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
        req.user = user;
        next();
    });
};

// API Đăng nhập
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Kiểm tra với env variable
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin@123';

    if (username === adminUser && password === adminPass) {
        // Cấp phát token
        const token = jwt.sign({ username: adminUser }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '8h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }
});

// Lấy danh sách bài viết
app.get('/api/posts', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT id, title, category, series, is_pinned, created_at FROM posts ORDER BY is_pinned DESC, created_at DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy 1 bài viết theo ID
app.get('/api/posts/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM posts WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Post not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Đăng bài viết mới
app.post('/api/posts', verifyToken, async (req, res) => {
    const { title, content, category, series, is_pinned } = req.body;
    try {
        const [result] = await pool.query(`INSERT INTO posts (title, content, category, series, is_pinned) VALUES (?, ?, ?, ?, ?)`,
            [title, content, category, series, is_pinned ? 1 : 0]);
        res.json({ id: result.insertId, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Xử lý file Word -> HTML
app.post('/api/upload-word', verifyToken, upload.single('document'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
        const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
        // result.value chứa HTML, result.messages chứa cảnh báo
        res.json({ html: result.value });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sửa bài viết
app.put('/api/posts/:id', verifyToken, async (req, res) => {
    const { title, content, category, series, is_pinned } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE posts SET title=?, content=?, category=?, series=?, is_pinned=? WHERE id=?`,
            [title, content, category, series, is_pinned ? 1 : 0, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Bài viết không tồn tại' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Xóa bài viết
app.delete('/api/posts/:id', verifyToken, async (req, res) => {
    try {
        const [result] = await pool.query(`DELETE FROM posts WHERE id=?`, [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Bài viết không tồn tại' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy danh sách bình luận của bài viết
app.get('/api/comments/:postId', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC`, [req.params.postId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Đăng bình luận
app.post('/api/comments', async (req, res) => {
    const { post_id, author_name, author_email, content } = req.body;
    try {
        const [result] = await pool.query(`INSERT INTO comments (post_id, author_name, author_email, content) VALUES (?, ?, ?, ?)`,
            [post_id, author_name, author_email, content]);
        res.json({ id: result.insertId, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Giao diện
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Chạy server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
