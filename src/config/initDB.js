const { pool } = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDB() {
    try {
        // 1. Categories Table
        await pool.query(`CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Users Table
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255),
            fullname VARCHAR(255),
            avatar VARCHAR(500),
            profession VARCHAR(255) DEFAULT 'Người dùng mới',
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'editor',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 3. Posts Table
        await pool.query(`CREATE TABLE IF NOT EXISTS posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title TEXT NOT NULL,
            content LONGTEXT,
            category_id INT,
            author_id INT,
            series TEXT,
            is_pinned BOOLEAN DEFAULT false,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
            FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
        )`);

        // 4. Post Likes Table
        await pool.query(`CREATE TABLE IF NOT EXISTS post_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            user_id INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_post (user_id, post_id),
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`);

        // 5. Comments Table
        await pool.query(`CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT,
            author_name TEXT,
            author_email TEXT,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
        )`);

        // 6. Seed Default Admin
        const [adminExists] = await pool.query('SELECT * FROM users WHERE role = ?', ['admin']);
        if (adminExists.length === 0) {
            const defaultUser = process.env.ADMIN_USERNAME || 'admin';
            const defaultPass = process.env.ADMIN_PASSWORD || 'admin@123';
            const defaultEmail = 'admin@example.com';
            const hash = await bcrypt.hash(defaultPass, 10);
            
            await pool.query(
                'INSERT INTO users (username, email, fullname, password, role, profession) VALUES (?, ?, ?, ?, ?, ?)', 
                [defaultUser, defaultEmail, 'Quản Trị Viên', hash, 'admin', 'System Engineer']
            );
            console.log(`Default admin user '${defaultUser}' seeded.`);
        }

        // 7. Dynamic schema updates (Migrations-like)
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday VARCHAR(50)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);

        await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS views INT DEFAULT 0`);
        await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0`);

        console.log("Connected to MariaDB database and tables initialized.");
    } catch (err) {
        console.error("Error initializing db:", err.message);
    }
}

module.exports = { initDB };
