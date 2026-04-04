const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const { rows: hackathons } = await pool.query(`SELECT id, title, status FROM hackathons ORDER BY "createdAt" DESC LIMIT 1`);
  const hackathonId = hackathons[0].id;
  
  const { rows: mentors } = await pool.query(`SELECT * FROM hackathon_mentors WHERE "hackathonId" = $1`, [hackathonId]);
  const { rows: teams } = await pool.query(`SELECT * FROM hackathon_teams WHERE "hackathonId" = $1 AND status = 'pending_approval'`, [hackathonId]);
  
  if (teams.length > 0 && mentors.length > 0) {
    const mentor = mentors[0];
    const team = teams[0];
    await pool.query(
      `INSERT INTO hackathon_team_mentor_assignments ("id", "teamId", "mentorId") VALUES (gen_random_uuid(), $1, $2)`,
      [team.id, mentor.mentorId]
    );
    console.log("Successfully created missing assignment for hackathon", hackathonId);
  } else {
    console.log("No mentors or teams pending");
  }

  process.exit(0);
}
run().catch(console.error);
