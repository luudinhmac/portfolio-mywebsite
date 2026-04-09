const { pool } = require('../config/db');
const mammoth = require('mammoth');
const sanitizeHtml = require('sanitize-html');

const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span']),
    allowedAttributes: {
        '*': ['style', 'class', 'id'],
        'a': ['href', 'name', 'target'],
        'img': ['src', 'alt', 'width', 'height']
    }
};

async function syncTags(postId, tags) {
    if (!tags) return;
    const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(t => t);
    
    // 1. Remove all old tags for this post
    await pool.query('DELETE FROM post_tags WHERE post_id = ?', [postId]);

    for (let tagName of tagList) {
        // 2. Ensure tag exists in 'tags' table
        await pool.query('INSERT IGNORE INTO tags (name) VALUES (?)', [tagName]);
        const [tagRows] = await pool.query('SELECT id FROM tags WHERE name = ?', [tagName]);
        if (tagRows.length > 0) {
            const tagId = tagRows[0].id;
            // 3. Link post to tag
            await pool.query('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
        }
    }
}

const getAllPosts = async (req, res) => {
    try {
        let query = `
            SELECT p.id, p.title, p.series, p.is_pinned, p.created_at, p.author_id, c.name as category, u.fullname as author_name 
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.author_id = u.id
        `;
        let params = [];

        if (req.user.role !== 'admin') {
            query += ` WHERE p.author_id = ? `;
            params.push(req.user.id);
        }

        query += ` ORDER BY p.is_pinned DESC, p.created_at DESC `;

        const [rows] = await pool.query(query, params);

        // Fetch tags for each post
        for (let post of rows) {
            const [tagRows] = await pool.query(`
                SELECT t.name FROM tags t
                JOIN post_tags pt ON t.id = pt.tag_id
                WHERE pt.post_id = ?
            `, [post.id]);
            post.tags = tagRows.map(r => r.name);
        }

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getPostById = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category, u.fullname as author_name 
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Post not found" });
        
        const post = rows[0];
        // Fetch tags
        const [tagRows] = await pool.query(`
            SELECT t.name FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = ?
        `, [post.id]);
        post.tags = tagRows.map(r => r.name);

        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createPost = async (req, res) => {
    const { title, content, category_id, series, is_pinned, tags } = req.body;
    try {
        const cleanContent = sanitizeHtml(content, sanitizeOptions);
        const author_id = req.user.id;
        const pinValue = (req.user.role === 'admin' && is_pinned) ? 1 : 0;
        const [result] = await pool.query(
            `INSERT INTO posts (title, content, category_id, author_id, series, is_pinned) VALUES (?, ?, ?, ?, ?, ?)`,
            [title, cleanContent, category_id || null, author_id, series, pinValue]
        );
        
        await syncTags(result.insertId, tags);

        res.json({ id: result.insertId, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updatePost = async (req, res) => {
    const { title, content, category_id, series, is_pinned, tags } = req.body;
    try {
        const [posts] = await pool.query('SELECT author_id FROM posts WHERE id = ?', [req.params.id]);
        if(posts.length === 0) return res.status(404).json({error: 'Post not found'});
        
        if(req.user.role !== 'admin' && posts[0].author_id !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền sửa bài viết này.' });
        }

        const cleanContent = sanitizeHtml(content, sanitizeOptions);
        await pool.query(
            `UPDATE posts SET title=?, content=?, category_id=?, series=? WHERE id=?`,
            [title, cleanContent, category_id || null, series, req.params.id]
        );
        
        await syncTags(req.params.id, tags);

        if (req.user.role === 'admin') {
           await pool.query('UPDATE posts SET is_pinned=? WHERE id=?', [is_pinned?1:0, req.params.id]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const [posts] = await pool.query('SELECT author_id FROM posts WHERE id = ?', [req.params.id]);
        if(posts.length === 0) return res.status(404).json({error: 'Post not found'});
        
        if(req.user.role !== 'admin' && posts[0].author_id !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền xóa bài viết này.' });
        }

        await pool.query(`DELETE FROM posts WHERE id=?`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const togglePin = async (req, res) => {
    if(req.user.role !== 'admin') return res.status(403).json({error: 'Chỉ Admin mới có quyền ghim bài.'});
    try {
        const [posts] = await pool.query('SELECT is_pinned FROM posts WHERE id=?', [req.params.id]);
        if(posts.length === 0) return res.status(404).json({error: 'Post not found'});
        const newStatus = posts[0].is_pinned ? 0 : 1;
        await pool.query('UPDATE posts SET is_pinned=? WHERE id=?', [newStatus, req.params.id]);
        res.json({success: true, is_pinned: newStatus});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const toggleLike = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const [existing] = await pool.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
        if (existing.length > 0) {
            await pool.query('DELETE FROM post_likes WHERE id = ?', [existing[0].id]);
            await pool.query('UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = ?', [id]);
            res.json({ liked: false });
        } else {
            await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, userId]);
            await pool.query('UPDATE posts SET likes = likes + 1 WHERE id = ?', [id]);
            res.json({ liked: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getLikeStatus = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const [rows] = await pool.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
        res.json({ liked: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const uploadWord = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
        const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
        const cleanHtml = sanitizeHtml(result.value, sanitizeOptions);
        res.json({ html: cleanHtml });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllPosts, getPostById, createPost, updatePost, deletePost, uploadWord, togglePin, toggleLike, getLikeStatus };

