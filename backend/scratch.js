require('dotenv').config();
const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

ds.initialize()
  .then(() => ds.query('SELECT * FROM certificates'))
  .then((res) => {
    console.log('Certificates:', res);
    process.exit(0);
  })
  .catch(console.error);
