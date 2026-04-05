const { pool } = require('../config/db');

const getCategories = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createCategory = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
    try {
        const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
        res.json({ id: result.insertId, name });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Danh mục đã tồn tại' });
        res.status(500).json({ error: err.message });
    }
};

const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
    try {
        await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Danh mục này đã tồn tại' });
        res.status(500).json({ error: err.message });
    }
};

const deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
