import "server-only"

const token = process.env.GITHUB_TOKEN || ""
const endpoint = "https://models.inference.ai.azure.com/chat/completions"

export interface ParsedResult {
    team1: string
    team2: string
    score1?: number
    score2?: number
    winner: string
    rawText: string
}

/**
 * Parse match results using GitHub Models AI (GPT-4o)
 */
export async function parseResultsWithAI(text: string): Promise<ParsedResult[]> {
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: `You are a sports result parser. Extract match results from text and return ONLY valid JSON array.
Format: [{"team1": "School A", "team2": "School B", "score1": 3, "score2": 1, "winner": "School A"}]
Rules:
- team1/team2: Full school names
- score1/score2: Numbers (optional if not provided)
- winner: Full name of winning team
- If draw/tie, winner is the team mentioned as winner (e.g., "won on penalties")
- Return empty array [] if no results found`
                    },
                    {
                        role: "user",
                        content: `Parse these match results:\n\n${text}`
                    }
                ],
                model: "gpt-4o",
                temperature: 0.1,
                max_tokens: 2000
            })
        })

        if (!response.ok) {
            throw new Error(`AI request failed: ${response.status}`)
        }

        const result = await response.json() as { choices: Array<{ message: { content: string } }> }
        const content = result.choices[0]?.message?.content || "[]"

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        const jsonStr = jsonMatch ? jsonMatch[0] : "[]"

        const parsed = JSON.parse(jsonStr) as ParsedResult[]

        // Add rawText to each result
        return parsed.map((r, i) => ({
            ...r,
            rawText: text.split('\n')[i] || text
        }))

    } catch (error) {
        console.error("AI parsing error:", error)
        // Fallback to regex-based parsing
        return parseResultsWithRegex(text)
    }
}

/**
 * Fallback regex-based parser for simple formats
 */
function parseResultsWithRegex(text: string): ParsedResult[] {
    const results: ParsedResult[] = []
    const lines = text.split('\n').filter(l => l.trim())

    for (const line of lines) {
        // Pattern: "Team A 3 - 1 Team B" or "Team A vs Team B: 2-0"
        const pattern1 = /^(.+?)\s+(\d+)\s*[-:]\s*(\d+)\s+(.+)$/
        const pattern2 = /^(.+?)\s+vs\.?\s+(.+?):\s*(\d+)\s*[-:]\s*(\d+)/i

        const match = line.match(pattern1) || line.match(pattern2)

        if (match) {
            const [, team1, score1Str, score2Str, team2] = match
            const score1 = parseInt(score1Str)
            const score2 = parseInt(score2Str)

            results.push({
                team1: team1.trim(),
                team2: team2.trim(),
                score1,
                score2,
                winner: score1 > score2 ? team1.trim() : team2.trim(),
                rawText: line
            })
        }
    }

    return results
}

/**
 * Fuzzy match school name to database
 */
export function fuzzyMatchSchool(searchName: string, schools: Array<{ id: string, name: string }>): string | null {
    const search = searchName.toLowerCase().trim()

    // Exact match first
    const exact = schools.find(s => s.name.toLowerCase() === search)
    if (exact) return exact.id

    // Contains match
    const contains = schools.find(s =>
        s.name.toLowerCase().includes(search) ||
        search.includes(s.name.toLowerCase())
    )
    if (contains) return contains.id

    // Fuzzy match (simple Levenshtein-like)
    let bestMatch: { id: string, score: number } | null = null

    for (const school of schools) {
        const score = similarityScore(search, school.name.toLowerCase())
        if (score > 0.7 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { id: school.id, score }
        }
    }

    return bestMatch?.id || null
}

function similarityScore(a: string, b: string): number {
    const longer = a.length > b.length ? a : b
    const shorter = a.length > b.length ? b : a

    if (longer.length === 0) return 1.0

    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                )
            }
        }
    }

    return matrix[b.length][a.length]
}
