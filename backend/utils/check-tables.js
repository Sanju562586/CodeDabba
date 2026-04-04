const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
    const client = new Client({
        connectionString: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log(res.rows.map(r => r.table_name));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
