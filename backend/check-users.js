const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function checkUsers() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    
    try {
        const res = await client.query('SELECT id, email, role, password FROM "user"');
        console.log("Users in DB:");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkUsers();
