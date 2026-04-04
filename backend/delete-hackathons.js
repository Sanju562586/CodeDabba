const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query('TRUNCATE table hackathons CASCADE;');
    console.log('Truncated hackathons completely.');
  } catch (e) {
    console.error('Failed TRUNCATE CASCADE:', e);
  }
  process.exit(0);
}
run().catch(console.error);
