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
    const res = await client.query("SELECT DISTINCT status::text FROM hackathons");
    console.log('Hackathon Statuses in DB:', res.rows.map(r => r.status));
    const enumRes = await client.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'hackathons_status_enum'");
    console.log('Hackathon Enum Labels in DB:', enumRes.rows.map(r => r.enumlabel));
    await client.end();
}
check();
