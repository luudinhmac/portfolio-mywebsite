const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, email, role, created_at FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createUser = async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }
    
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email || null, hash, role || 'admin']);
        res.json({ id: result.insertId, username, email, role: role || 'admin' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        }
        res.status(500).json({ error: err.message });
    }
};

const updatePassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) return res.status(400).json({ error: 'Mật khẩu là bắt buộc' });
    
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [users] = await pool.query('SELECT id FROM users');
        if (users.length <= 1) {
            return res.status(400).json({ error: 'Không thể xóa user cuối cùng trong hệ thống' });
        }
    
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getUsers, createUser, updatePassword, deleteUser };
