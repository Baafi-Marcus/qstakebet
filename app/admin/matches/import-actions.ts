"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from "@/lib/db"
import { apiKeys, schools, matches, tournaments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function parseFixturesWithAI(formData: FormData) {
    try {
        const text = formData.get("text") as string
        const image = formData.get("image") as File | null

        // 1. Get Gemini Key
        const keyRecord = await db.select().from(apiKeys).where(eq(apiKeys.provider, "gemini")).limit(1)
        if (!keyRecord.length || !keyRecord[0].isActive) {
            return { success: false, error: "No active Gemini API key found. Please add one in Admin Settings." }
        }
        
        const genAI = new GoogleGenerativeAI(keyRecord[0].key)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        // 2. Get Schools for Context
        const dbSchools = await db.select({ id: schools.id, name: schools.name }).from(schools)
        const schoolListStr = dbSchools.map(s => `${s.name} (ID: ${s.id})`).join("\n")

        const prompt = `You are a sports data extraction assistant.
I will provide you with text or an image of upcoming school fixtures/matches.
Here is the official list of schools in our database:
${schoolListStr}

Your task is to extract all matches and output a raw JSON array.
Each object in the array must match this exact structure:
{
    "stage": string (e.g. "Quarter Final", "Zone 1"),
    "scheduledAt": string (ISO 8601 UTC timestamp of when the match starts),
    "status": string ("upcoming" if it's a fixture, "completed" if it's a final result/already played),
    "participants": [
        { "schoolId": string, "name": string, "score": number | null },
        { "schoolId": string, "name": string, "score": number | null },
        ...
    ]
}

CRITICAL INSTRUCTIONS:
- Use the provided school list to fuzzy match the names in the image/text to find the exact "schoolId". If a school is not in the list, omit the match or leave schoolId null.
- If there is no specific time, default to 10:00:00 UTC on the date of the match.
- If the image or text contains points/scores, set status to "completed" and fill in the "score". If it's just a fixture with no scores, set status to "upcoming".
- Output ONLY valid JSON, do not include markdown \`\`\`json blocks.
`

        let resultText = ""

        if (image && image.size > 0) {
            const buffer = await image.arrayBuffer()
            const base64Data = Buffer.from(buffer).toString("base64")
            
            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType: image.type } }
            ])
            resultText = result.response.text()
        } else if (text) {
            const result = await model.generateContent([prompt, text])
            resultText = result.response.text()
        } else {
            return { success: false, error: "Please provide either text or an image." }
        }

        // Clean up markdown if any
        resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim()
        const parsedMatches = JSON.parse(resultText)

        return { success: true, data: parsedMatches }
    } catch (e: any) {
        console.error("AI Parse Error:", e)
        return { success: false, error: e.message || "Failed to parse fixtures." }
    }
}

export async function saveImportedMatches(matchesData: any[]) {
    try {
        // Find an active tournament or the latest one to attach matches to
        const activeTournaments = await db.select().from(tournaments)
            .where(eq(tournaments.status, "active"))
            .orderBy(desc(tournaments.createdAt))
            .limit(1)
            
        const tournamentId = activeTournaments.length > 0 ? activeTournaments[0].id : "default-tournament"

        const newMatches = matchesData.map(m => {
            const matchStatus = m.status === "completed" ? "completed" : "upcoming";
            
            // Build result object if it's completed
            let resultData = null;
            if (matchStatus === "completed") {
                resultData = {
                    scores: m.participants.reduce((acc: any, p: any) => {
                        acc[p.schoolId || p.name] = p.score || 0;
                        return acc;
                    }, {})
                };
            }

            return {
                id: `match-${Math.random().toString(36).substr(2, 9)}`,
                tournamentId,
                stage: m.stage || "Unknown Stage",
                scheduledAt: new Date(m.scheduledAt),
                participants: m.participants.map((p: any) => ({
                    schoolId: p.schoolId,
                    name: p.name,
                    odd: 2.0 // Default odd, can be updated later
                })),
                status: matchStatus,
                isLive: false,
                result: resultData,
                odds: {},
                currentRound: 0,
                isVirtual: false,
                sportType: "quiz",
                gender: "male",
                margin: 0.1
            }
        })

        await db.insert(matches).values(newMatches)
        revalidatePath("/admin/matches")
        revalidatePath("/fantasy") 
        
        return { success: true }
    } catch (e: any) {
        console.error("Save Imported Matches Error:", e)
        return { success: false, error: e.message || "Failed to save matches to database." }
    }
}
