const mysql = require('mysql2/promise');
require('dotenv').config();

async function reset() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '192.168.157.109',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'portfolio_db'
    });

    try {
        console.log("Dropping tables...");
        await pool.query('DROP TABLE IF EXISTS comments');
        await pool.query('DROP TABLE IF EXISTS posts');
        await pool.query('DROP TABLE IF EXISTS categories');
        await pool.query('DROP TABLE IF EXISTS users');
        console.log("All tables dropped successfully.");
    } catch(err) {
        console.error("Error:", err.message);
    } finally {
        pool.end();
    }
}

reset();
