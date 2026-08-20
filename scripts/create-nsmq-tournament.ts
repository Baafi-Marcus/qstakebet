import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not configured in .env");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
    try {
        console.log("Checking if tournament already exists...");
        const existing = await sql`
            SELECT id FROM tournaments WHERE id = 'nsmq-2026'
        `;

        const metadata = {
            calendar: [
                { stage: "Preliminary Stage", startDate: "2026-08-20", endDate: "2026-08-24" },
                { stage: "One-Eighth Stage", startDate: "2026-08-26", endDate: "2026-08-28" },
                { stage: "Quarter-Final Stage", startDate: "2026-08-30", endDate: "2026-09-01" },
                { stage: "Semi-Finals", startDate: "2026-09-03", endDate: "2026-09-03" },
                { stage: "Grand Finale", startDate: "2026-09-10", endDate: "2026-09-10" }
            ],
            rules: {
                maxSelections: 3,
                budget: 100,
                rounds: 5
            }
        };

        if (existing.length > 0) {
            console.log("Tournament nsmq-2026 already exists. Updating metadata and status...");
            await sql`
                UPDATE tournaments
                SET 
                    name = 'National Science & Maths Quiz 2026',
                    region = 'National',
                    sport_type = 'quiz',
                    gender = 'mixed',
                    year = '2026',
                    level = 'shs',
                    status = 'active',
                    metadata = ${JSON.stringify(metadata)}
                WHERE id = 'nsmq-2026'
            `;
            console.log("Tournament updated successfully!");
        } else {
            console.log("Inserting new tournament nsmq-2026...");
            await sql`
                INSERT INTO tournaments (id, name, region, sport_type, gender, year, level, status, metadata)
                VALUES (
                    'nsmq-2026', 
                    'National Science & Maths Quiz 2026', 
                    'National', 
                    'quiz', 
                    'mixed', 
                    '2026', 
                    'shs', 
                    'active', 
                    ${JSON.stringify(metadata)}
                )
            `;
            console.log("Tournament created successfully!");
        }
    } catch (e) {
        console.error("Error creating tournament:", e);
    }
}

run();
