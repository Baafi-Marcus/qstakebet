import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log("Settling Match 1 and Match 2...");
    if (!process.env.DATABASE_URL) throw new Error("No DB URL");
    const sql = neon(process.env.DATABASE_URL);
    
    // Match 1
    // Edinaman SHS (47) vs Abomosu STEM (35) vs Wa SHS (11)
    const m1Id = 'nsmq-2026-m1';
    let m1 = await sql`SELECT participants, result FROM matches WHERE id = ${m1Id}`;
    if (m1.length > 0) {
        const parts = typeof m1[0].participants === 'string' ? JSON.parse(m1[0].participants) : m1[0].participants;
        const customScores: Record<string, number> = {};
        for (const p of parts) {
            if (p.name.includes("Edinaman")) customScores[p.schoolId] = 47;
            if (p.name.includes("Abomosu")) customScores[p.schoolId] = 35;
            if (p.name.includes("Wa SHS")) customScores[p.schoolId] = 11;
        }
        console.log("Match 1 Scores:", customScores);
        await sql`UPDATE matches SET result = ${JSON.stringify({ scores: customScores })}, status = 'settled' WHERE id = ${m1Id}`;
    }

    // Match 2
    // St. Hubert Sem. SHS (51) vs Bright SHS (48) vs Akwamuman SHS (29)
    const m2Id = 'nsmq-2026-m2';
    let m2 = await sql`SELECT participants, result FROM matches WHERE id = ${m2Id}`;
    if (m2.length > 0) {
        const parts = typeof m2[0].participants === 'string' ? JSON.parse(m2[0].participants) : m2[0].participants;
        const customScores: Record<string, number> = {};
        for (const p of parts) {
            if (p.name.includes("Hubert")) customScores[p.schoolId] = 51;
            if (p.name.includes("Bright")) customScores[p.schoolId] = 48;
            if (p.name.includes("Akwamuman")) customScores[p.schoolId] = 29;
        }
        console.log("Match 2 Scores:", customScores);
        await sql`UPDATE matches SET result = ${JSON.stringify({ scores: customScores })}, status = 'settled' WHERE id = ${m2Id}`;
    }
    
    console.log("Match 1 and 2 successfully settled via database.");
}

run().catch(console.error).finally(() => process.exit(0));
