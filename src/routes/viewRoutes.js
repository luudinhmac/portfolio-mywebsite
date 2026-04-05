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
        const { category, series, author, search } = req.query;
        let query = `
            SELECT p.id, p.title, p.series, p.is_pinned, p.created_at, p.author_id, p.views, p.likes,
                   c.name as category, u.fullname as author_name,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.author_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += " AND c.name = ?";
            params.push(category);
        }
        if (series) {
            query += " AND p.series = ?";
            params.push(series);
        }
        if (author) {
            query += " AND p.author_id = ?";
            params.push(author);
        }
        if (search) {
            query += " AND (p.title LIKE ? OR p.content LIKE ? OR c.name LIKE ? OR p.series LIKE ? OR u.fullname LIKE ?)";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += " ORDER BY p.is_pinned DESC, p.created_at DESC";

        const [rows] = await pool.query(query, params);
        
        if (req.xhr || req.headers.accept.indexOf('json') > -1 && req.query.ajax) {
            return res.json({ posts: rows, filters: req.query });
        }
        
        res.render('blog/blog', { posts: rows, filters: req.query });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Post Detail
router.get('/post/:id', async (req, res) => {
    try {
        // Increment views
        await pool.query('UPDATE posts SET views = views + 1 WHERE id = ?', [req.params.id]);

        const [rows] = await pool.query(`
            SELECT p.*, c.name as category, u.fullname as author_name 
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).send('Post not found');
        res.render('blog/post', { post: rows[0] });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Auth
router.get('/sys-login', (req, res) => {
    res.redirect('/');
});

router.get('/auth-success', (req, res) => {
    res.render('auth/auth_success', { 
        token: req.query.token, 
        user: req.query.user 
    });
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

// Admin Users
router.get('/manage_users', (req, res) => {
    res.render('admin/manage_users');
});

router.get('/create_user', (req, res) => {
    res.render('admin/create_user');
});

router.get('/edit_user/:id', (req, res) => {
    res.render('admin/edit_user', { userId: req.params.id });
});

router.get('/profile', (req, res) => {
    res.render('admin/profile');
});

router.get('/manage_categories', (req, res) => {
    res.render('admin/manage_categories');
});

module.exports = router;
