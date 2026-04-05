const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/auth');
const authController = require('../controllers/authController');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const userController = require('../controllers/userController');
const categoryController = require('../controllers/categoryController');

// Multer config for Mammoth (Word to HTML)
const upload = multer({ storage: multer.memoryStorage() });

// Multer config for Avatars
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/avatars/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const uploadAvatar = multer({ 
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Auth
router.post('/login', authController.login);

// Posts
router.get('/posts', verifyToken, postController.getAllPosts);
router.get('/posts/:id', postController.getPostById);
router.post('/posts', verifyToken, postController.createPost);
router.put('/posts/:id', verifyToken, postController.updatePost);
router.delete('/posts/:id', verifyToken, postController.deletePost);
router.put('/posts/:id/pin', verifyToken, postController.togglePin);
router.post('/posts/:id/like', verifyToken, postController.toggleLike);
router.get('/posts/:id/like-status', verifyToken, postController.getLikeStatus);
router.post('/upload-word', verifyToken, upload.single('document'), postController.uploadWord);

// Comments
router.get('/comments/:postId', commentController.getCommentsByPostId);
router.post('/comments', commentController.createComment);

// Users
router.get('/users', verifyToken, userController.getUsers);
router.post('/users', verifyToken, userController.createUser);
router.put('/users/:id/password', verifyToken, userController.updatePassword);
router.put('/users/:id/profile', verifyToken, userController.updateProfile);
router.delete('/users/:id', verifyToken, userController.deleteUser);
router.post('/users/upload-avatar', verifyToken, uploadAvatar.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Không tìm thấy file ảnh' });
    res.json({ url: `/uploads/avatars/${req.file.filename}` });
});

// Categories
router.get('/categories', categoryController.getCategories);
router.post('/categories', verifyToken, categoryController.createCategory);
router.put('/categories/:id', verifyToken, categoryController.updateCategory);
router.delete('/categories/:id', verifyToken, categoryController.deleteCategory);

module.exports = router;
