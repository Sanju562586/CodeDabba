const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

async function seedModulesAndLessons() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    
    try {
        console.log("Finding course...");
        const res = await client.query('SELECT id FROM "course" WHERE slug = $1', ['dsa-python']);
        if (res.rows.length === 0) {
            console.error("Course not found!");
            return;
        }
        const courseId = res.rows[0].id;
        console.log("Found course ID:", courseId);

        const modules = [
            { title: "Module 1: Introduction and Arrays", orderIndex: 1 },
            { title: "Module 2: Linked Lists and Trees", orderIndex: 2 }
        ];

        for (const mod of modules) {
            const moduleId = uuidv4();
            await client.query(`
                INSERT INTO "module" (id, title, "courseId", "orderIndex", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, NOW(), NOW())
            `, [moduleId, mod.title, courseId, mod.orderIndex]);
            console.log("Inserted Module:", mod.title);

            // Insert 3 lessons (chapters) for this module
            for (let i = 1; i <= 3; i++) {
                const chapterId = uuidv4();
                const lessonTitle = `${mod.title} - Lesson ${i}`;
                await client.query(`
                    INSERT INTO "chapter" (id, title, points, "isFreePreview", "moduleId", "orderIndex", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                `, [chapterId, lessonTitle, 10, i === 1, moduleId, i]);
                console.log("  Inserted Lesson:", lessonTitle);
            }
        }

        console.log("Module and lesson seeding complete!");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

seedModulesAndLessons();
