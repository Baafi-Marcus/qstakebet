import "server-only"
import { getActiveKey, reportKeyError } from "./ai-key-manager"

export interface ParsedRosterEntity {
    schoolName: string
    groupName?: string
}

/**
 * Parse tournament roster and group assignments using AI (Gemini key pool).
 */
export async function parseRosterWithAI(text: string): Promise<ParsedRosterEntity[]> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        const token = await getActiveKey("gemini");

        if (!token) {
            console.error("No available API keys.");
            break;
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${token}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: AbortSignal.timeout(60000),
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are a high-precision data extractor for a sports tournament management system.

Your task is to extract a list of schools (or participating entities) and their assigned groups from the provided text.

Rules:
1. Return ONLY a valid JSON array of objects. No conversational text.
2. Each object must have "schoolName" and optionally "groupName".
3. "groupName" should be normalized to standard labels like "Group A", "Group B", etc., unless the text specifies a different grouping style.
4. If a piece of text mentions multiple schools for a group, extract each school individually.
5. Be smart about messy formats: bullet points, paragraphs, tables, or colon-separated lists.
6. Format:
[
  { "schoolName": "Kumasi High School", "groupName": "Group A" },
  { "schoolName": "Prempeh College", "groupName": "Group A" },
  { "schoolName": "Opoku Ware", "groupName": "Group B" }
]
7. If no groups are mentioned, still return the schools with "groupName" as null.

Text:
${text}`
                            }]
                        }],
                        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
                    })
                }
            );

            if (!response.ok) {
                if (response.status === 429 || response.status === 401 || response.status === 403) {
                    await reportKeyError(token);
                    continue;
                }
                throw new Error(`AI request failed: ${response.status}`)
            }

            const result = await response.json() as {
                candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
            }
            const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

            // Extract JSON - handle both raw arrays and objects wrapping an array
            let parsed: ParsedRosterEntity[] = []
            try {
                const cleaned = content.replace(/```json|```/g, '').trim()
                const raw = JSON.parse(cleaned)
                if (Array.isArray(raw)) {
                    parsed = raw
                } else {
                    // AI returned an object - find the first array value inside it
                    const arrayVal = Object.values(raw).find(v => Array.isArray(v))
                    parsed = (arrayVal as ParsedRosterEntity[]) || []
                }
            } catch {
                // Last resort: regex extraction
                const jsonMatch = content.match(/\[[\s\S]*\]/)
                parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : []
            }

            return parsed

        } catch (error) {
            console.error(`Roster AI Attempt ${attempts} failed:`, error);
            if (attempts >= maxAttempts) break;
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // Fallback: Simple line parser if AI fails completely
    return text.split('\n').filter(l => l.trim()).map(line => ({
        schoolName: line.trim(),
        groupName: undefined
    }));
}
