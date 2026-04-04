const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const { rows: hackathons } = await pool.query(`SELECT id, title, status FROM hackathons ORDER BY "createdAt" DESC LIMIT 1`);
  const hackathon = hackathons[0];
  console.log('Hackathon:', hackathon);
  
  const { rows: teams } = await pool.query(`SELECT id, status FROM hackathon_teams WHERE "hackathonId" = $1`, [hackathon.id]);
  console.log('Teams:', teams);
  
  const { rows: mentors } = await pool.query(`SELECT "mentorId", "assignmentType" FROM hackathon_mentors WHERE "hackathonId" = $1`, [hackathon.id]);
  console.log('Mentors:', mentors);
  
  const { rows: assignments } = await pool.query(`SELECT * FROM hackathon_team_mentor_assignments WHERE "teamId" = ANY($1::uuid[])`, [teams.map(t => t.id).length > 0 ? teams.map(t => t.id) : ['00000000-0000-0000-0000-000000000000']]);
  console.log('Assignments:', assignments);
  process.exit(0);
}
run().catch(console.error);
