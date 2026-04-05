const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const validatePassword = (password) => {
    // At least 8 characters, must contain at least one letter and one number
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/;
    return regex.test(password);
};

const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, email, fullname, avatar, profession, role, phone, birthday, address, created_at FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createUser = async (req, res) => {
    const { username, email, password, role, fullname, profession, phone, birthday, address } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Mật khẩu phải hối thiểu 8 ký tự, bao gồm cả chữ và số.' });
    }
    
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password, role, fullname, profession, phone, birthday, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [username, email || null, hash, role || 'editor', fullname || null, profession || 'Người dùng mới', phone || null, birthday || null, address || null]
        );
        res.json({ id: result.insertId, username, email, role: role || 'editor' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        }
        res.status(500).json({ error: err.message });
    }
};

const updateProfile = async (req, res) => {
    const { id } = req.params;
    const { fullname, email, profession, avatar, phone, birthday, address } = req.body;
    
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Bạn không có quyền sửa thông tin này.' });
    }

    try {
        await pool.query(
            'UPDATE users SET fullname=?, email=?, profession=?, avatar=?, phone=?, birthday=?, address=? WHERE id=?',
            [fullname || null, email || null, profession || null, avatar || null, phone || null, birthday || null, address || null, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updatePassword = async (req, res) => {
    const { id } = req.params;
    const { old_password, new_password } = req.body;
    
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Bạn không có quyền đổi mật khẩu của người khác.' });
    }

    if (!new_password) return res.status(400).json({ error: 'Mật khẩu mới là bắt buộc' });

    if (!validatePassword(new_password)) {
        return res.status(400).json({ error: 'Mật khẩu mới phải hối thiểu 8 ký tự, bao gồm cả chữ và số.' });
    }
    
    try {
        if (req.user.role !== 'admin' || req.user.id === parseInt(id)) {
            if(!old_password) return res.status(400).json({ error: 'Bạn phải cung cấp mật khẩu hiện tại.'});
            
            const [users] = await pool.query('SELECT password FROM users WHERE id=?', [id]);
            if(users.length === 0) return res.status(404).json({error: 'Không tìm thấy user.'});
            
            const match = await bcrypt.compare(old_password, users[0].password);
            if(!match) return res.status(400).json({error: 'Mật khẩu hiện tại không chính xác.'});
        }
    
        const hash = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [adminCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
        const [targetUser] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
        
        if (targetUser.length === 0) return res.status(404).json({ error: 'User not found' });
        
        // Prevent deleting last admin
        if (targetUser[0].role === 'admin' && adminCount[0].count <= 1) {
            return res.status(400).json({ error: 'Không thể xóa admin cuối cùng bộ lọc hệ thống' });
        }
    
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getUsers, createUser, updateProfile, updatePassword, deleteUser };

