const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const { rows: hackathons } = await pool.query(`SELECT id, title, status FROM hackathons ORDER BY "createdAt" DESC LIMIT 1`);
  const hackathonId = hackathons[0].id;
  
  const { rows: mentors } = await pool.query(`SELECT * FROM hackathon_mentors WHERE "hackathonId" = $1`, [hackathonId]);
  
  const { rows: teams } = await pool.query(`SELECT * FROM hackathon_teams WHERE "hackathonId" = $1 AND status = 'pending_approval'`, [hackathonId]);
  
  console.log(`For hackathon ${hackathonId}:`);
  console.log(`mentors.length = ${mentors.length}`);
  console.log(`teams.length = ${teams.length}`);
  
  if (teams.length > 0 && mentors.length > 0) {
    console.log("Distribution should have created an assignment!");
  } else {
    console.log("Distribution would do nothing because mentors=", mentors.length, " teams=", teams.length);
  }

  process.exit(0);
}
run().catch(console.error);
