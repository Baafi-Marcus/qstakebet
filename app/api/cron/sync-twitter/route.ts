import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { db } from "@/lib/db";
import { pendingResults } from "@/lib/db/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const maxDuration = 60; // Allow up to 60 seconds for scraping and AI processing

export async function GET(req: Request) {
    try {
        if (!process.env.APIFY_API_TOKEN) {
            return NextResponse.json({ error: "APIFY_API_TOKEN is not configured" }, { status: 500 });
        }
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
        }

        const client = new ApifyClient({
            token: process.env.APIFY_API_TOKEN,
        });

        // Use a reliable Twitter Scraper (apidojo/tweet-scraper)
        const input = {
            searchTerms: ["from:NSMQGhana"],
            maxItems: 5,
            sort: "Latest",
            tweetLanguage: "en",
        };

        console.log("Starting Apify Twitter Scraper...");
        const run = await client.actor("apidojo/tweet-scraper").call(input);
        
        console.log(`Apify run finished. Fetching results from dataset: ${run.defaultDatasetId}`);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length === 0) {
            return NextResponse.json({ message: "No tweets found", success: true });
        }

        console.log(`Found ${items.length} tweets. Processing with Gemini...`);

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
        const pendingRecords = [];

        for (const tweet of items as any[]) {
            const tweetText = String(tweet.full_text || tweet.text || "");
            if (!tweetText) continue;

            // Simple check to skip obvious non-match tweets
            if (!tweetText.toLowerCase().includes("contest") && !tweetText.toLowerCase().includes("points") && !tweetText.toLowerCase().includes("end of") && !tweetText.toLowerCase().includes("fixture") && !tweetText.toLowerCase().includes("round")) {
                continue;
            }

            const prompt = `Analyze this social media post from the National Science and Maths Quiz (NSMQ). 
Extract the schools and their scores, or the fixture details if it's an upcoming match.
Post text: "${tweetText}"`;

            const result = await model.generateContent(prompt);
            const parsed = JSON.parse(result.response.text());

            if (parsed.isResult) {
                const id = `pr-${Math.random().toString(36).substring(2, 9)}`;
                await db.insert(pendingResults).values({
                    id,
                    source: "apify_twitter_cron",
                    rawText: tweetText,
                    parsedData: parsed,
                    status: "pending"
                });
                processedCount++;
                pendingRecords.push(parsed);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully processed ${processedCount} relevant tweets out of ${items.length} fetched.`,
            records: pendingRecords
        });

    } catch (error: any) {
        console.error("Error in Apify Twitter sync:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
