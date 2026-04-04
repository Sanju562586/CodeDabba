const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
    const client = new Client({
        connectionString: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query('SELECT id, score, "finalScore", "isScored", "isFinal" FROM hackathon_submissions');
        res.rows.forEach(r => console.log(r));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
