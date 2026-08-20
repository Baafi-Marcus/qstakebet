import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function run() {
    try {
        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL is not configured in .env");
            process.exit(1);
        }

        const sql = neon(process.env.DATABASE_URL);

        const realResults = [
            {
                text: "CNC AUDITORIUM: \n\nEnd of Round 1\n\nAccra Girls’ SHS: 23 pts\nAsamankese SHS: 11 pts\nSandema SHS: 11 pts",
                parsed: {
                    isResult: true,
                    round: 1,
                    scores: [
                        { schoolName: "Accra Girls' SHS", score: 23 },
                        { schoolName: "Asamankese SHS", score: 11 },
                        { schoolName: "Sandema SHS", score: 11 }
                    ]
                }
            }
        ];

        let processedCount = 0;

        for (const res of realResults) {
            const id = `pr-${crypto.randomUUID().substring(0, 8)}`;
            
            await sql`
                INSERT INTO pending_results (id, source, raw_text, parsed_data, status, created_at)
                VALUES (${id}, 'manual_paste', ${res.text}, ${JSON.stringify(res.parsed)}, 'pending', NOW())
            `;
            processedCount++;
        }

        console.log(`Local sync finished! Successfully queued ${processedCount} true results to the database queue.`);
    } catch (e) {
        console.error("Error during local script execution:", e);
    }
}

run();
