const { pool } = require('../config/db');
const mammoth = require('mammoth');

const getAllPosts = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT id, title, category, series, is_pinned, created_at FROM posts ORDER BY is_pinned DESC, created_at DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getPostById = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM posts WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Post not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createPost = async (req, res) => {
    const { title, content, category, series, is_pinned } = req.body;
    try {
        const [result] = await pool.query(`INSERT INTO posts (title, content, category, series, is_pinned) VALUES (?, ?, ?, ?, ?)`,
            [title, content, category, series, is_pinned ? 1 : 0]);
        res.json({ id: result.insertId, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updatePost = async (req, res) => {
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
};

const deletePost = async (req, res) => {
    try {
        const [result] = await pool.query(`DELETE FROM posts WHERE id=?`, [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Bài viết không tồn tại' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const uploadWord = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
        const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
        res.json({ html: result.value });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllPosts, getPostById, createPost, updatePost, deletePost, uploadWord };
