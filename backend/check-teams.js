const { Client } = require('pg');
require('dotenv').config();
async function check() {
    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const res = await client.query("SELECT DISTINCT status::text FROM hackathon_teams");
    console.log('Team Statuses in DB:', res.rows.map(r => r.status));
    await client.end();
}
check();
