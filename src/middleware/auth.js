const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    // Priority: 1. Cookie, 2. Authorization Header
    let token = req.cookies.token;
    
    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) return res.status(401).json({ error: 'Truy cập bị từ chối. Vui lòng đăng nhập.' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });

        // Check if session exists (lost after server restart)
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Phiên làm việc đã hết hạn do hệ thống khởi động lại. Vui lòng đăng nhập lại.' });
        }

        req.user = user;
        next();
    });
};

module.exports = verifyToken;
