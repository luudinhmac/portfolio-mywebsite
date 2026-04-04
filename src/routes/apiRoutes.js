const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyToken = require('../middleware/auth');
const authController = require('../controllers/authController');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');

// Multer config for Mammoth (Word to HTML)
const upload = multer({ storage: multer.memoryStorage() });

// Auth
router.post('/login', authController.login);

// Posts
router.get('/posts', postController.getAllPosts);
router.get('/posts/:id', postController.getPostById);
router.post('/posts', verifyToken, postController.createPost);
router.put('/posts/:id', verifyToken, postController.updatePost);
router.delete('/posts/:id', verifyToken, postController.deletePost);
router.post('/upload-word', verifyToken, upload.single('document'), postController.uploadWord);

// Comments
router.get('/comments/:postId', commentController.getCommentsByPostId);
router.post('/comments', commentController.createComment);

module.exports = router;
