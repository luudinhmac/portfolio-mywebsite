const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
require('dotenv').config();

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role }, 
                process.env.JWT_SECRET || 'fallback_secret_key', 
                { expiresIn: '8h' }
            );
            res.json({ 
                success: true, 
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    fullname: user.fullname,
                    avatar: user.avatar,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
};

const socialCallback = (req, res) => {
    if (!req.user) {
        return res.redirect('/sys-login?error=auth_failed');
    }
    
    // Generate JWT
    const token = jwt.sign(
        { id: req.user.id, username: req.user.username, role: req.user.role }, 
        process.env.JWT_SECRET || 'fallback_secret_key', 
        { expiresIn: '8h' }
    );
    
    // Pass user info and token via URL parameters (to be handled by /auth-success view)
    const userData = encodeURIComponent(JSON.stringify({
        id: req.user.id,
        username: req.user.username,
        fullname: req.user.fullname,
        avatar: req.user.avatar,
        role: req.user.role
    }));
    
    res.redirect(`/auth-success?token=${token}&user=${userData}`);
};

module.exports = { login, socialCallback };
