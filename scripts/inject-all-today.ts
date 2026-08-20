import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function run() {
    try {
        console.log("Injecting final End of Contest results for today's remaining matches...");

        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL is not configured in .env");
            process.exit(1);
        }

        const sql = neon(process.env.DATABASE_URL);

        const realResults = [
            {
                text: "End of Contest\n\nAccra Girls’ SHS: 52 pts\nAsamankese SHS: 39 pts\nSandema SHS: 23 pts",
                parsed: {
                    isResult: true,
                    round: 5,
                    scores: [
                        { schoolName: "Accra Girls' SHS", score: 52 },
                        { schoolName: "Asamankese SHS", score: 39 },
                        { schoolName: "Sandema SHS", score: 23 }
                    ]
                }
            },
            {
                text: "End of Contest\n\nWesley High School, Bekwai: 38pts\nTechiman SHS: 37pts\nEsaase Bontefufuo SHS: 23pts",
                parsed: {
                    isResult: true,
                    round: 5,
                    scores: [
                        { schoolName: "Wesley High Sch., Bekwai", score: 38 },
                        { schoolName: "Techiman SHS", score: 37 },
                        { schoolName: "Esaase Bontefufuo SHTS", score: 23 }
                    ]
                }
            },
            {
                text: "End of contest:\n\nPresby SHS, Bompata: 58pts\nSacred Heart SHS: 39pts\nMansen SHS: 7pts",
                parsed: {
                    isResult: true,
                    round: 5,
                    scores: [
                        { schoolName: "Presby SHS, Bompata", score: 58 },
                        { schoolName: "Sacred Heart SHS", score: 39 },
                        { schoolName: "Mansen SHS", score: 7 }
                    ]
                }
            },
            {
                text: "End of Contest\n\nNandom SHS: 41 pts \nGhana SHS, Koforidua: 40 pts\nTuobodom SHTS: 14 pts",
                parsed: {
                    isResult: true,
                    round: 5,
                    scores: [
                        { schoolName: "Nandom SHS", score: 41 },
                        { schoolName: "Ghana SHS, Koforidua", score: 40 },
                        { schoolName: "Tuobodom SHTS", score: 14 }
                    ]
                }
            },
            {
                text: "End of Contest\n\nBenkum SHS: 52pts\nSekondi College: 38pts\nAkumfi Ameyaw SHTS: 24pts",
                parsed: {
                    isResult: true,
                    round: 5,
                    scores: [
                        { schoolName: "Benkum SHS", score: 52 },
                        { schoolName: "Sekondi College", score: 38 },
                        { schoolName: "Akumfi Ameyaw SHTS", score: 24 }
                    ]
                }
            },
            {
                text: "End of contest:\n\nKumasi High School: 45pts\nNalerigu SHS: 34pts\nJachie Pramso SHS: 30pts",
                parsed: {
                    isResult: true,
                    round: 5,
                    scores: [
                        { schoolName: "Kumasi High School", score: 45 },
                        { schoolName: "Nalerigu SHS", score: 34 },
                        { schoolName: "Jachie Pramso SHS", score: 30 }
                    ]
                }
            },
            {
                text: "End of Contest\n\nSt. Louis SHS: 69pts \nSDA SHS, Bekwai: 39pts \nT.I. AMASS, Salaga: 18pts",
                parsed: {
                    isResult: true,
                    round: 5,
                    scores: [
                        { schoolName: "St. Louis SHS", score: 69 },
                        { schoolName: "SDA SHS, Bekwai", score: 39 },
                        { schoolName: "T. I. Amass, Salaga", score: 18 }
                    ]
                }
            }
        ];

        let processedCount = 0;

        for (const res of realResults) {
            const id = `pr-${crypto.randomUUID().substring(0, 8)}`;
            
            await sql`
                INSERT INTO pending_results (id, source, raw_text, parsed_data, status, created_at)
                VALUES (${id}, 'manual_paste_final', ${res.text}, ${JSON.stringify(res.parsed)}, 'pending', NOW())
            `;
            processedCount++;
        }

        console.log(`Local sync finished! Successfully queued ${processedCount} final contest results to the database queue.`);
    } catch (e) {
        console.error("Error during local script execution:", e);
    }
}

run();
