const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
    const client = new Client({
        connectionString: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query('SELECT "roundScore", "cumulativeScore", "roundId" FROM hackathon_leaderboard');
        console.log("Entries:");
        res.rows.forEach(r => console.log(`RS: ${r.roundScore}, CS: ${r.cumulativeScore}, RID: ${r.roundId}`));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
