const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
    const client = new Client({
        connectionString: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log("--- Leaderboard Table ---");
        const res = await client.query(`
            SELECT 
                l.rank,
                l.id,
                t.name as team_name,
                l.round_score,
                l.cumulative_score,
                l.round_id
            FROM hackathon_leaderboard l
            JOIN hackathon_teams t ON l.team_id = t.id
            ORDER BY l.rank ASC
        `);
        console.table(res.rows);

        console.log("\n--- Submissions Table ---");
        const res2 = await client.query(`
            SELECT 
                id,
                team_id,
                round_id,
                final_score,
                is_scored
            FROM hackathon_submissions
            WHERE is_final = true
        `);
        console.table(res2.rows);

        console.log("\n--- Rounds Table ---");
        const res3 = await client.query(`
            SELECT 
                id,
                round_number,
                title,
                weightage_percentage
            FROM hackathon_rounds
        `);
        console.table(res3.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
