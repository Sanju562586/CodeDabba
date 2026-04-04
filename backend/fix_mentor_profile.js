const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

const MENTOR_ID = 'ecdef8a3-3c6f-4531-b1a6-d6506cb65c37';

async function run() {
    await client.connect();

    try {
        console.log('Checking for existing profile...');
        const check = await client.query('SELECT * FROM "mentor_profile" WHERE "userId" = $1', [MENTOR_ID]);

        if (check.rows.length > 0) {
            console.log('Profile already exists. Updating Verification Status...');
            await client.query('UPDATE "mentor_profile" SET "isVerified" = true WHERE "userId" = $1', [MENTOR_ID]);
        } else {
            console.log('Creating new Mentor Profile...');
            const newId = uuidv4();
            await client.query(
                `INSERT INTO "mentor_profile" (id, "userId", "isVerified", "resume", "portfolio") 
                 VALUES ($1, $2, $3, $4, $5)`,
                [newId, MENTOR_ID, true, 'resume.pdf', 'portfolio.com']
            );
        }
        console.log('Done!');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
