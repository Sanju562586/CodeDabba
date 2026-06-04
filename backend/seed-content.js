const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

const ADMIN_ID = '7958dcc5-d6cf-4569-a3cc-fcabdc81e7d7';
const MENTOR_ID = 'a148d20a-6776-45ba-ab0c-193d53fdceb4';

async function seed() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    
    try {
        console.log("Seeding Courses...");
        const courses = [
            { title: 'Fullstack Web Development with Next.js', slug: 'fullstack-web-nextjs', level: 'beginner', cat: 'Web Development', price: 0, access: 'free' },
            { title: 'Advanced React Patterns', slug: 'advanced-react-patterns', level: 'advanced', cat: 'Frontend', price: 99.99, access: 'paid' },
            { title: 'Mastering Node.js and Microservices', slug: 'mastering-nodejs-microservices', level: 'intermediate', cat: 'Backend', price: 49.99, access: 'paid' },
            { title: 'Data Structures and Algorithms in Python', slug: 'dsa-python', level: 'beginner', cat: 'Computer Science', price: 0, access: 'free' },
            { title: 'DevOps Cloud Engineering AWS', slug: 'devops-cloud-aws', level: 'intermediate', cat: 'Cloud Computing', price: 79.99, access: 'paid' },
        ];

        for (const c of courses) {
            const id = uuidv4();
            await client.query(`
                INSERT INTO "course" 
                (id, title, slug, description, level, category, price, "accessType", status, visibility, "mentorId", "createdAt", "updatedAt") 
                VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, 'published', 'public', $9, NOW(), NOW())
            `, [id, c.title, c.slug, `Learn ${c.title} from scratch to advanced.`, c.level, c.cat, c.price, c.access, MENTOR_ID]);
        }
        
        console.log("Seeding Hackathons...");
        const hackathons = [
            { title: 'Global AI Hackathon 2026', desc: 'Build the next generation of AI tools and applications in 48 hours.', start: new Date(Date.now() - 86400000), end: new Date(Date.now() + 86400000*30) },
            { title: 'Web3 & Blockchain Innovators', desc: 'Create decentralized applications for the modern web.', start: new Date(Date.now() + 86400000*7), end: new Date(Date.now() + 86400000*14) }
        ];

        for (const h of hackathons) {
            const id = uuidv4();
            await client.query(`
                INSERT INTO "hackathons"
                (id, title, description, "registrationStart", "registrationEnd", status, "createdById", "createdAt", "updatedAt")
                VALUES
                ($1, $2, $3, $4, $5, 'registration_open', $6, NOW(), NOW())
            `, [id, h.title, h.desc, h.start, h.end, ADMIN_ID]);
        }

        console.log("Seeding complete!");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

seed();
