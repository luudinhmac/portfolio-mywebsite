const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Home
router.get('/', (req, res) => {
    res.render('blog/index');
});

// Blog List
router.get('/blog', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT id, title, category, series, is_pinned, created_at FROM posts ORDER BY is_pinned DESC, created_at DESC`);
        res.render('blog/blog', { posts: rows });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Post Detail
router.get('/post/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM posts WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).send('Post not found');
        res.render('blog/post', { post: rows[0] });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Auth
router.get('/sys-login', (req, res) => {
    res.render('auth/login');
});

// Admin Dashboard
router.get('/manage_posts', (req, res) => {
    res.render('admin/manage_posts');
});

router.get('/create_post', (req, res) => {
    res.render('admin/create_post');
});

router.get('/edit_post/:id', (req, res) => {
    res.render('admin/edit_post', { postId: req.params.id });
});

router.get('/portal-dashboard', (req, res) => {
    res.render('admin/dashboard');
});

module.exports = router;
