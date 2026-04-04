const { Client } = require('pg');
require('dotenv').config();

async function checkDb() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const enumRes = await client.query(`
            SELECT enumlabel 
            FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE typname = 'hackathon_rounds_status_enum';
        `);
        const countsRes = await client.query(`
            SELECT status::text as status_val, COUNT(*) as count 
            FROM hackathon_rounds 
            GROUP BY status;
        `);
        console.log(JSON.stringify({
            labels: enumRes.rows.map(r => r.enumlabel),
            counts: countsRes.rows
        }));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
checkDb();
