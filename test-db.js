require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
    try {
        console.log("Connecting...");
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'mydb',
            port: process.env.DB_PORT || 3306,
            connectTimeout: 5000
        });
        await pool.query('SELECT 1');
        console.log('Successfully connected!');
        process.exit(0);
    } catch (e) {
        console.error('Connection failed:', e.message);
        process.exit(1);
    }
}
test();
