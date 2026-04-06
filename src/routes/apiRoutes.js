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

const passport = require('passport');

// Auth
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getMe);
router.post('/auth/forgot-password', authController.forgotPassword);

// Social Auth Routes
router.get('/auth/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(501).json({ error: 'Google Auth not configured' });
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get('/auth/google/callback', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) return res.redirect('/?error=google_not_configured');
    passport.authenticate('google', { failureRedirect: '/?error=auth_failed' })(req, res, next),
    authController.socialCallback
});

router.get('/auth/facebook', (req, res, next) => {
    if (!process.env.FACEBOOK_APP_ID) return res.status(501).json({ error: 'Facebook Auth not configured' });
    passport.authenticate('facebook', { scope: ['email', 'public_profile'] })(req, res, next);
});
router.get('/auth/facebook/callback', (req, res, next) => {
    if (!process.env.FACEBOOK_APP_ID) return res.redirect('/?error=facebook_not_configured');
    passport.authenticate('facebook', { failureRedirect: '/?error=auth_failed' })(req, res, next),
    authController.socialCallback
});

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
