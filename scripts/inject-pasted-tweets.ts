import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function run() {
    try {
        console.log("Simulating pasted tweets into pending_results...");

        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL is not configured in .env");
            process.exit(1);
        }

        const sql = neon(process.env.DATABASE_URL);

        const realResults = [
            {
                text: "End of Round 2: St. Hubert Seminary SHS: 33pts, Bright SHS: 19pts, Akwamuman SHS: 17pts",
                parsed: {
                    isResult: true,
                    round: 2,
                    scores: [
                        { schoolName: "St. Hubert Sem. SHS", score: 33 },
                        { schoolName: "Bright SHS", score: 19 },
                        { schoolName: "Akwamuman SHS", score: 17 }
                    ]
                }
            },
            {
                text: "End of Round 3: Edinaman SHS: 32pts, Abomosu STEM SHS: 16pts, Wa SHS: 09pts",
                parsed: {
                    isResult: true,
                    round: 3,
                    scores: [
                        { schoolName: "Edinaman SHS", score: 32 },
                        { schoolName: "Abomosu STEM SHS", score: 16 },
                        { schoolName: "Wa SHS", score: 9 }
                    ]
                }
            },
            {
                text: "End of Round 1: Bright SHS: 19pts, St. Hubert Seminary SHS: 18pts, Akwamuman SHS: 15pts",
                parsed: {
                    isResult: true,
                    round: 1,
                    scores: [
                        { schoolName: "Bright SHS", score: 19 },
                        { schoolName: "St. Hubert Sem. SHS", score: 18 },
                        { schoolName: "Akwamuman SHS", score: 15 }
                    ]
                }
            },
            {
                text: "End of Round 2: Edinaman SHS: 28pts, Abomosu STEM SHS: 12pts, Wa SHS: 07pts",
                parsed: {
                    isResult: true,
                    round: 2,
                    scores: [
                        { schoolName: "Edinaman SHS", score: 28 },
                        { schoolName: "Abomosu STEM SHS", score: 12 },
                        { schoolName: "Wa SHS", score: 7 }
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
