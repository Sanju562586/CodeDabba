const axios = require('axios');
async function distribute() {
  try {
     const pool = require('pg').Pool;
     const db = new pool({ connectionString: process.env.DATABASE_URL });
     const { rows: hackathons } = await db.query(`SELECT id FROM hackathons ORDER BY "createdAt" DESC LIMIT 1`);
     
     // let's just login as admin to get token
     const login = await axios.post('http://localhost:5000/auth/login', {
       email: 'hello.codedabba@gmail.com', // wait, do we know admin email?
       password: 'dummy' // probably we don't.
     });
     
  } catch (e) {
  }
}
