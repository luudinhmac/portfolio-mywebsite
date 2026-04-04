const { pool } = require('../config/db');

const getCommentsByPostId = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC`, [req.params.postId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createComment = async (req, res) => {
    const { post_id, author_name, author_email, content } = req.body;
    try {
        const [result] = await pool.query(`INSERT INTO comments (post_id, author_name, author_email, content) VALUES (?, ?, ?, ?)`,
            [post_id, author_name, author_email, content]);
        res.json({ id: result.insertId, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getCommentsByPostId, createComment };
