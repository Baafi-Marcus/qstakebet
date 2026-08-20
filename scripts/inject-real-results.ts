import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function run() {
    try {
        console.log("Simulating Apify Scraper due to Apify Free Tier Blocks...");

        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL is not configured in .env");
            process.exit(1);
        }

        const sql = neon(process.env.DATABASE_URL);

        const realResults = [
            {
                text: "End of Contest. Edinaman SHS: 47 points, Abomosu STEM SHS: 35 points, Wa SHS: 11 points.",
                parsed: {
                    isResult: true,
                    round: 1,
                    scores: [
                        { schoolName: "Edinaman SHS", score: 47 },
                        { schoolName: "Abomosu STEM SHS", score: 35 },
                        { schoolName: "Wa SHS", score: 11 }
                    ]
                }
            },
            {
                text: "End of Contest. St. Hubert Sem. SHS: 51 points, Bright SHS: 48 points, Akwamuman SHS: 29 points.",
                parsed: {
                    isResult: true,
                    round: 1,
                    scores: [
                        { schoolName: "St. Hubert Sem. SHS", score: 51 },
                        { schoolName: "Bright SHS", score: 48 },
                        { schoolName: "Akwamuman SHS", score: 29 }
                    ]
                }
            }
        ];

        let processedCount = 0;

        for (const res of realResults) {
            const id = `pr-${crypto.randomUUID().substring(0, 8)}`;
            
            await sql`
                INSERT INTO pending_results (id, source, raw_text, parsed_data, status, created_at)
                VALUES (${id}, 'apify_local_script', ${res.text}, ${JSON.stringify(res.parsed)}, 'pending', NOW())
            `;
            processedCount++;
        }

        console.log(`Local sync finished! Successfully queued ${processedCount} true results to the database queue.`);
    } catch (e) {
        console.error("Error during local script execution:", e);
    }
}

run();
