const { Pool } = require('pg');
const jwt = require('jsonwebtoken'); // hope this is in node_modules
const axios = require('axios');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const { rows } = await pool.query("SELECT id, email, name FROM users WHERE role = 'admin' LIMIT 1;");
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
    role: 'admin',
    name: admin.name
  }, 'super_secret_jwt_key_12345', { expiresIn: '1d' });
  
  const payload = {
    title: "CodeDabba Genesis 2026",
    description: "This hackathon is designed to test innovation, teamwork, and problem-solving skills. Participants will form squads, collaborate, and build impactful solutions within a structured timeline. Each phase is time-bound and automated to simulate a real-world competitive environment.",
    rules: "Participants must register within the registration window.\nTeams (or solo players) must adhere to submission deadlines.\nPlagiarism will result in immediate disqualification.\nAll submissions must include required deliverables.\nMentor decisions during evaluation are final.",
    evaluationCriteria: "Innovation & Creativity (30%)\nTechnical Implementation (30%)\nProblem Understanding (20%)\nPresentation & Clarity (20%)",
    registrationStart: "2026-03-29T11:57:00+05:30",
    registrationEnd: "2026-03-29T12:02:00+05:30",
    mentorSelectionStart: "2026-03-29T12:03:00+05:30",
    mentorSelectionEnd: "2026-03-29T12:07:00+05:30",
    approvalStart: "2026-03-29T12:08:00+05:30",
    approvalEnd: "2026-03-29T12:12:00+05:30",
    maxTeamSize: 1,
    maxParticipants: 0,
    allowIndividual: true,
    allowTeam: false,
    rounds: [
      {
        title: "Idea Phase",
        submissionStart: "2026-03-29T12:13:00+05:30",
        submissionEnd: "2026-03-29T12:18:00+05:30",
        evaluationStart: "2026-03-29T12:19:00+05:30",
        evaluationEnd: "2026-03-29T12:23:00+05:30",
        resultTime: "2026-03-29T12:24:00+05:30",
        weightagePercentage: 100,
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
