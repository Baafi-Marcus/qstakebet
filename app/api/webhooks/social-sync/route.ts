import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { db } from "@/lib/db";
import { pendingResults, apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        let geminiKey = process.env.GEMINI_API_KEY;

        if (!geminiKey) {
            const dbKeys = await db.select().from(apiKeys).where(and(eq(apiKeys.provider, "gemini"), eq(apiKeys.isActive, true))).limit(1);
            if (dbKeys.length > 0) {
                geminiKey = dbKeys[0].key;
                await db.update(apiKeys).set({ usageCount: dbKeys[0].usageCount + 1, lastUsedAt: new Date() }).where(eq(apiKeys.id, dbKeys[0].id));
            }
        }

        if (!geminiKey) {
            return NextResponse.json({ error: "Gemini API key is not configured in ENV or Admin Panel" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(geminiKey);

        const body = await req.json();
        const { text, source = "webhook" } = body;

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        isResult: {
                            type: SchemaType.BOOLEAN,
                            description: "True if the text contains a match result or score update. False otherwise."
                        },
                        round: {
                            type: SchemaType.NUMBER,
                            description: "The round number (e.g. 1, 2, 3) or stage of the match, if mentioned."
                        },
                        scores: {
                            type: SchemaType.ARRAY,
                            description: "List of schools and their extracted scores",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    schoolName: {
                                        type: SchemaType.STRING,
                                        description: "The name of the school as written"
                                    },
                                    score: {
                                        type: SchemaType.NUMBER,
                                        description: "The points/score of the school"
                                    }
                                },
                                required: ["schoolName", "score"]
                            }
                        }
                    },
                    required: ["isResult"]
                }
            }
        });

        const prompt = `Analyze this social media post from the National Science and Maths Quiz (NSMQ). 
Extract the schools and their scores.
Post text: "${text}"`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());

        if (!parsed.isResult) {
            return NextResponse.json({ message: "Post does not contain a match result", parsed }, { status: 200 });
        }

        const id = `pr-${Math.random().toString(36).substring(2, 9)}`;

        await db.insert(pendingResults).values({
            id,
            source,
            rawText: text,
            parsedData: parsed,
            status: "pending"
        });

        return NextResponse.json({ success: true, id, parsed });

    } catch (error) {
        console.error("Error in social-sync webhook:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
