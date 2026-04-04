const { Pool } = require('pg');
const jwt = require('jsonwebtoken'); 
const axios = require('axios');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const { rows } = await pool.query("SELECT id, email, name, role FROM \"user\" WHERE role = 'ADMIN' LIMIT 1;");
  if (rows.length === 0) {
    console.error("No admin user found!");
    process.exit(1);
  }
  const admin = rows[0];
  
  // Create token
  const token = jwt.sign({ 
    sub: admin.id, 
    email: admin.email,
    id: admin.id,
    role: admin.role,
    name: admin.name
  }, 'super_secret_jwt_key_12345', { expiresIn: '1d' });
  
  const payload = {
    title: "CodeDabba Flash Sprint 2026",
    description: "A rapid-fire hackathon designed to test speed, creativity, and execution under extreme time constraints. Participants must ideate, build, and present solutions within minutes. This is a testing hackathon to validate system workflows and real-time submissions.",
    rules: "Participants can join solo or as a team (max 1 member for testing)\nAll submissions must be original\nUse of AI tools is allowed for testing purposes\nLate submissions will not be considered\nJudges' decisions are final\nPlagiarism will lead to disqualification",
    evaluationCriteria: "Innovation & Idea Clarity (30%)\nFeasibility (20%)\nTechnical Approach (20%)\nPresentation (15%)\nCompleteness (15%)",
    registrationStart: "2026-04-04T12:00:00+05:30",
    registrationEnd: "2026-04-04T12:02:00+05:30",
    mentorSelectionStart: "2026-04-04T12:02:00+05:30",
    mentorSelectionEnd: "2026-04-04T12:04:00+05:30",
    approvalStart: "2026-04-04T12:04:00+05:30",
    approvalEnd: "2026-04-04T12:06:00+05:30",
    maxTeamSize: 1,
    maxParticipants: 0,
    allowIndividual: true,
    allowTeam: true,
    rounds: [
      {
        title: "Idea Phase",
        submissionStart: "2026-04-04T12:06:00+05:30",
        submissionEnd: "2026-04-04T12:12:00+05:30",
        evaluationStart: "2026-04-04T12:12:00+05:30",
        evaluationEnd: "2026-04-04T12:17:00+05:30",
        resultTime: "2026-04-04T12:20:00+05:30",
        weightagePercentage: 20,
        allowZip: true,
        allowGithub: true,
        allowVideo: true,
        allowDescription: true
      }
    ]
  };

  try {
    const res = await axios.post('http://localhost:5000/hackathons', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Successfully created hackathon:", res.data.id);
  } catch (e) {
    console.error("Failed to create hackathon:", e.response ? e.response.data : e.message);
  }
  process.exit(0);
}

run().catch(console.error);
