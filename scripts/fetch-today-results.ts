import { ApifyClient } from "apify-client";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function run() {
    try {
        console.log("Starting local Apify Twitter Scraper...");

        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL is not configured in .env");
            process.exit(1);
        }

        const sql = neon(process.env.DATABASE_URL);

        // Fetch API keys from DB if not in .env
        let apifyToken = process.env.APIFY_API_TOKEN;
        if (!apifyToken) {
            const apifyKeys = await sql`SELECT key FROM api_keys WHERE provider = 'apify' AND is_active = true LIMIT 1`;
            if (apifyKeys.length > 0) apifyToken = apifyKeys[0].key;
        }

        let geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            const geminiKeys = await sql`SELECT key FROM api_keys WHERE provider = 'gemini' AND is_active = true LIMIT 1`;
            if (geminiKeys.length > 0) geminiKey = geminiKeys[0].key;
        }

        if (!apifyToken || !geminiKey) {
            console.error("Missing Apify or Gemini API keys!");
            process.exit(1);
        }

        const client = new ApifyClient({ token: apifyToken });

        const input = {
            searchTerms: ["from:NSMQGhana (points OR contest OR \"End of\")"], 
            maxItems: 10
        };

        console.log("Calling Apify Actor (this may take 30-60 seconds)...");
        const apifyRun = await client.actor("apidojo/twitter-scraper-lite").call(input);
        
        console.log(`Apify run finished. Fetching results from dataset: ${apifyRun.defaultDatasetId}`);
        const { items } = await client.dataset(apifyRun.defaultDatasetId).listItems();

        if (items.length === 0) {
            console.log("No tweets found!");
            return;
        }

        console.log(`Found ${items.length} tweets. Processing with Gemini...`);

        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        isResult: {
                            type: SchemaType.BOOLEAN,
                            description: "True if the text contains a match result, fixture, or score update. False otherwise."
                        },
                        round: {
                            type: SchemaType.NUMBER,
                            description: "The round number (e.g. 1, 2, 3) or stage of the match, if mentioned."
                        },
                        scores: {
                            type: SchemaType.ARRAY,
                            description: "List of schools and their extracted scores or fixtures",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    schoolName: {
                                        type: SchemaType.STRING,
                                        description: "The name of the school as written"
                                    },
                                    score: {
                                        type: SchemaType.NUMBER,
                                        description: "The points/score of the school if it's a result (can be 0 or omitted if it's just a fixture)"
                                    }
                                },
                                required: ["schoolName"]
                            }
                        }
                    },
                    required: ["isResult"]
                }
            }
        });

        let processedCount = 0;

        for (const tweet of items as any[]) {
            const tweetText = String(tweet.full_text || tweet.text || "");
            if (!tweetText) continue;

            if (!tweetText.toLowerCase().includes("contest") && 
                !tweetText.toLowerCase().includes("points") && 
                !tweetText.toLowerCase().includes("end of") && 
                !tweetText.toLowerCase().includes("fixture") && 
                !tweetText.toLowerCase().includes("round")) {
                continue;
            }

            const prompt = `Analyze this social media post from the National Science and Maths Quiz (NSMQ). 
Extract the schools and their scores, or the fixture details if it's an upcoming match.
Post text: "${tweetText}"`;

            const result = await model.generateContent(prompt);
            const parsed = JSON.parse(result.response.text());

            if (parsed.isResult) {
                const id = `pr-${crypto.randomUUID().substring(0, 8)}`;
                
                // Insert into pending_results
                await sql`
                    INSERT INTO pending_results (id, source, raw_text, parsed_data, status, created_at)
                    VALUES (${id}, 'apify_local_script', ${tweetText}, ${JSON.stringify(parsed)}, 'pending', NOW())
                `;
                processedCount++;
            }
        }

        console.log(`Local sync finished! Successfully queued ${processedCount} relevant tweets to the database.`);

    } catch (e) {
        console.error("Error during local script execution:", e);
    }
}

run();
