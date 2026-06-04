const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

async function seedBlocks() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    
    try {
        console.log("Finding chapters...");
        // Get all chapters for the 'dsa-python' course
        const res = await client.query(`
            SELECT c.id, c.title
            FROM "chapter" c
            JOIN "module" m ON c."moduleId" = m.id
            JOIN "course" cr ON m."courseId" = cr.id
            WHERE cr.slug = $1
        `, ['dsa-python']);
        
        const chapters = res.rows;
        if (chapters.length === 0) {
            console.error("No chapters found for 'dsa-python' course!");
            return;
        }

        console.log("Found " + chapters.length + " chapters. Inserting lesson blocks...");

        for (const chapter of chapters) {
            // Block 1: Intro Text
            const textId = uuidv4();
            const textContent = "# Welcome to " + chapter.title + "\\n\\nIn this lesson, we will dive deep into the fundamental concepts of data structures. You will learn the theoretical background, implementation details in Python, and the time complexity of common operations.\\n\\nMake sure to follow along with the video below and practice the examples in your local environment.";
            
            await client.query(`
                INSERT INTO "lesson_block" (id, type, content, "orderIndex", "chapterId", "createdAt", "updatedAt")
                VALUES ($1, 'text', $2, 1, $3, NOW(), NOW())
            `, [textId, textContent, chapter.id]);

            // Block 2: Video
            const videoId = uuidv4();
            // A standard open source video placeholder (Big Buck Bunny) or YouTube embed. We use a valid URL.
            const videoContent = 'https://www.w3schools.com/html/mov_bbb.mp4';
            
            await client.query(`
                INSERT INTO "lesson_block" (id, type, content, "orderIndex", "chapterId", "createdAt", "updatedAt")
                VALUES ($1, 'video', $2, 2, $3, NOW(), NOW())
            `, [videoId, videoContent, chapter.id]);
            
            // Block 3: Summary Text
            const summaryId = uuidv4();
            const summaryContent = "### Summary\\n- Key concept 1 covered.\\n- Best practices highlighted.\\n- Check the next lesson for advanced topics.";
            
            await client.query(`
                INSERT INTO "lesson_block" (id, type, content, "orderIndex", "chapterId", "createdAt", "updatedAt")
                VALUES ($1, 'text', $2, 3, $3, NOW(), NOW())
            `, [summaryId, summaryContent, chapter.id]);

            console.log("Inserted blocks for chapter: " + chapter.title);
        }

        console.log("Lesson block seeding complete!");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

seedBlocks();
