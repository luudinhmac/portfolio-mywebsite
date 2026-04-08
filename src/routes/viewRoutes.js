const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// SEO Meta Helper
const getSeoData = (post) => {
    if (!post) return { title: 'Blog - Zero2Ops', description: 'Kiến thức về System Engineer, DevOps và Linux.' };
    
    // Remove HTML tags for description
    const plainText = post.content ? post.content.replace(/<[^>]*>?/gm, '').substring(0, 160).trim() : '';
    
    return {
        title: `${post.title} - Zero2Ops`,
        description: plainText + (plainText.length >= 160 ? '...' : ''),
        image: post.cover_image || '/images/zero2ops.jpg'
    };
};

// Home
router.get('/', (req, res) => {
    res.render('blog/index');
});

// Blog List
router.get('/blog', async (req, res) => {
    try {
        const { category, series, author, search, tag } = req.query;
        let query = `
            SELECT DISTINCT p.id, p.title, p.series, p.is_pinned, p.created_at, p.author_id, p.views, p.likes,
                   c.name as category, u.fullname as author_name,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.author_id = u.id
        `;
        
        if (tag) {
            query += ` JOIN post_tags pt ON p.id = pt.post_id JOIN tags t ON pt.tag_id = t.id `;
        } else if (search) {
            query += ` LEFT JOIN post_tags pt_search ON p.id = pt_search.post_id LEFT JOIN tags t_search ON pt_search.tag_id = t_search.id `;
        }

        query += ` WHERE 1=1 `;
        const params = [];
        
        if (tag) {
            query += " AND t.name = ?";
            params.push(tag);
        }

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
            query += " AND (p.title LIKE ? OR p.content LIKE ? OR c.name LIKE ? OR p.series LIKE ? OR u.fullname LIKE ? OR t_search.name LIKE ?)";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += " ORDER BY p.is_pinned DESC, p.created_at DESC";

        const [rows] = await pool.query(query, params);
        
        // Fetch tags for each post
        for (let post of rows) {
            const [postTags] = await pool.query(`
                SELECT t.name FROM tags t
                JOIN post_tags pt ON t.id = pt.tag_id
                WHERE pt.post_id = ?
            `, [post.id]);
            post.tags = postTags.map(t => t.name);
        }

        // Fetch all tags for sidebar
        const [allTags] = await pool.query('SELECT name, (SELECT COUNT(*) FROM post_tags WHERE tag_id = tags.id) as count FROM tags ORDER BY name ASC');
        if (req.xhr || req.headers.accept.indexOf('json') > -1 && req.query.ajax) {
            return res.json({ posts: rows, filters: req.query, allTags });
        }
        
        const seo = {
            title: 'Blog - Kiến thức System Engineer | Zero2Ops',
            description: 'Chia sẻ kiến thức, kinh nghiệm và góc nhìn về DevOps, Linux và System Engineer.'
        };
        
        res.render('blog/blog', { posts: rows, filters: req.query, allTags, seo });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Post Detail
router.get('/post/:id', async (req, res) => {
    try {
        // Increment views
        await pool.query('UPDATE posts SET views = views + 1 WHERE id = ?', [req.params.id]);

        // Get Current Post
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category, u.fullname as author_name 
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) return res.status(404).send('Post not found');
        const post = rows[0];

        // Fetch tags for this post
        const [postTags] = await pool.query(`
            SELECT t.name FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = ?
        `, [post.id]);
        post.tags = postTags.map(t => t.name);

        // Series Navigation
        let prevPost = null;
        let nextPost = null;
        if (post.series) {
            const [prev] = await pool.query(
                'SELECT id, title FROM posts WHERE series = ? AND created_at < ? ORDER BY created_at DESC LIMIT 1',
                [post.series, post.created_at]
            );
            const [next] = await pool.query(
                'SELECT id, title FROM posts WHERE series = ? AND created_at > ? ORDER BY created_at ASC LIMIT 1',
                [post.series, post.created_at]
            );
            prevPost = prev[0] || null;
            nextPost = next[0] || null;
        }

        const seo = getSeoData(post);
        res.render('blog/post', { post, prevPost, nextPost, seo });
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

// Sitemap
router.get('/sitemap.xml', async (req, res) => {
    try {
        const [posts] = await pool.query('SELECT id, updated_at FROM posts ORDER BY updated_at DESC');
        const baseUrl = 'https://zero2ops.blog';
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        
        // Static Pages
        xml += `  <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>\n`;
        xml += `  <url><loc>${baseUrl}/blog</loc><priority>0.9</priority></url>\n`;
        
        // Blog Posts
        posts.forEach(post => {
            const lastMod = new Date(post.updated_at).toISOString().split('T')[0];
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/post/${post.id}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        });
        
        xml += `</urlset>`;
        
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        res.status(500).send(err.message);
    }
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

router.get('/settings', (req, res) => {
    res.render('admin/settings');
});

router.get('/manage_categories', (req, res) => {
    res.render('admin/manage_categories');
});

module.exports = router;
