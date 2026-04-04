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
    const res = await client.query("SELECT n.nspname as schema, t.typname as type FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'hackathon_rounds_status_enum'");
    console.log(res.rows);
    await client.end();
}
check();
