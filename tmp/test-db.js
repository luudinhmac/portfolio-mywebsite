const { pool } = require('./src/config/db');

async function test() {
    try {
        console.log('Testing DB connection...');
        const [rows] = await pool.query('SELECT 1 + 1 as result');
        console.log('DB Result:', rows[0].result);
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log('Users count:', users[0].count);
        process.exit(0);
    } catch (err) {
        console.error('DB Error:', err.message);
        process.exit(1);
    }
}

test();
