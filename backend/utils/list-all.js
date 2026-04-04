
const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        console.log('--- USERS ---');
        const users = await client.query("SELECT id, email, role, name FROM users");
        console.table(users.rows);

        console.log('--- HACKATHONS ---');
        const hackathons = await client.query("SELECT id, title, status FROM hackathons");
        console.table(hackathons.rows);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}
check();
