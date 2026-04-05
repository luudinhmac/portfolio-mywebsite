require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool } = require('./src/config/db');
const { initDB } = require('./src/config/initDB');
const apiRoutes = require('./src/routes/apiRoutes');
const viewRoutes = require('./src/routes/viewRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Set to false to avoid breaking inline scripts for now
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Limit each IP to 10 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later'
});

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Apply rate limits
app.use('/api/', limiter);
app.use('/api/login', loginLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Database
initDB();

// Routes
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

// Error handling
app.use((req, res, next) => {
    res.status(404).render('blog/index'); // Or a custom 404 page
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
