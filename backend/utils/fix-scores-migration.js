const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
    const client = new Client({
        connectionString: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log("Recalculating score fields in submissions...");
        // Update finalScore from score if finalScore is 0 but score is not
        await client.query(`
            UPDATE hackathon_submissions 
            SET "finalScore" = score 
            WHERE "isFinal" = true AND ("finalScore" IS NULL OR "finalScore" = 0) AND score > 0
        `);

        console.log("Scores updated. Please re-run round finalization from the admin panel if possible, or wait for the next cron.");
        
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
