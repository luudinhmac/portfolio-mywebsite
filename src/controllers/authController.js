const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = (req, res) => {
    const { username, password } = req.body;
    
    // Check with env variable
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin@123';

    if (username === adminUser && password === adminPass) {
        // Sign token
        const token = jwt.sign({ username: adminUser }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '8h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }
};

module.exports = { login };
