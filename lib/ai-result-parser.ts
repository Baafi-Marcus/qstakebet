import "server-only"

// Token logic moved to getActiveKey
const endpoint = "https://models.inference.ai.azure.com/chat/completions"

export interface ParsedResult {
    team1: string
    team2: string
    score1?: number
    score2?: number
    winner: string
    footballDetails?: {
        [schoolName: string]: { ht: number, ft: number }
    }
    metadata?: Record<string, any>
    rawText: string
}

/**
 * Parse match results using GitHub Models AI (GPT-4o)
 */
// Replace static token
import { getActiveKey, reportKeyError } from "./ai-key-manager"

// Helper to wait
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function parseResultsWithAI(text: string): Promise<ParsedResult[]> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        const token = await getActiveKey("github_models");

        if (!token) {
            console.error("No available API keys.");
            break;
        }

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
                            content: `You are a high-precision sports result extractor. Your task is to extract match results from the provided text.
                            
Rules:
1. Return ONLY a valid JSON array. No conversational text, no "Here is your JSON".
2. If match results are ambiguous, make your best professional guess based on the phrasing.
3. If no match results are found, return an empty array [].
4. Format:
[
  {
    "team1": "Full School Name",
    "team2": "Full School Name",
    "score1": 3,
    "score2": 1,
    "winner": "Full School Name",
    "footballDetails": {
      "Full School Name": { "ht": 1, "ft": 3 },
      "Other School Name": { "ht": 0, "ft": 1 }
    },
    "metadata": {
      "period": "FT",
      "outcomes": { "First Half Winner": "Full School Name" }
    }
  }
]
5. If the score is missing but a winner is mentioned, include the winner and leave scores null.
6. Extract Half-Time (HT) vs Full-Time (FT) scores if explicitly mentioned (e.g., "1-0 at HT, 3-1 FT").
7. Extract period-specific winners or special event outcomes if mentioned (e.g., "Round 1 winner: X", "Q1: 12-10").`
                        },
                        {
                            role: "user",
                            content: `Extract match results from this text and return as JSON array:\n\n${text}`
                        }
                    ],
                    model: "gpt-4o",
                    temperature: 0.1,
                    max_tokens: 2000,
                    response_format: { type: "json_object" } // Try to force JSON if supported, though we wrap in array. Actually gpt-4o supports it.
                })
            })


            if (!response.ok) {
                // If 429 (Too Many Requests) or 401 (Unauthorized), report error and retry
                if (response.status === 429 || response.status === 401) {
                    console.warn(`AI Request failed with ${response.status}. Switching key...`);
                    await reportKeyError(token);
                    continue; // Retry loop will get new key
                }
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
            console.error(`Attempt ${attempts} failed:`, error);
            // If it's the last attempt, fall through to regex
            if (attempts >= maxAttempts) break;
            await wait(1000); // Backoff slightly
        }
    }

    console.warn("Falling back to Regex parser due to AI failure.");
    return parseResultsWithRegex(text)
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

export type AIMarketSuggestion = {
    marketName: string
    selections: Array<{
        label: string
        odds: number
    }>
}

/**
 * Generate creative, profitable betting markets using AI
 * @param matchDetails Description of the match (teams, sport, context)
 * @param existingMarkets List of market names already present to avoid duplicates
 */
export async function getAIMarketSuggestions(
    matchDetails: string,
    existingMarkets: string[] = []
): Promise<AIMarketSuggestion[]> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        const token = await getActiveKey("github_models");
        if (!token) return [];

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
                            content: `You are a professional sports bookmaker for a diverse campus tournament. Generate 3-5 creative, high-engagement betting markets for this match.
                        
Rules:
1. **Sport Awareness**: The tournament includes Football, Basketball, Athletics, and Quiz competitions. Tailor your suggestions to the specific sport mentioned.
2. **Standard Keys**: For common markets, use these EXACT keys in your JSON object:
   - 'handicap' -> for point spreads
   - 'totalPoints' -> for over/under totals
   - 'podium' -> for Top 3 finishes (Athletics)
   - 'h2h' -> for head-to-head matchups
3. **Specials**: You can create unique keys for special markets (e.g., 'firstTeamToScore', 'mostRiddlesSolved').
4. **Context Aware**: Do NOT suggest markets that are already listed: ${existingMarkets.join(", ")}.
5. **Profitability**: You MUST build in a **15% House Margin (Vig)** into the odds. The implied probability of all options in a market should sum to ~115%.
   - Formula: FairProb = 1/FairOdd. VigProb = FairProb * 1.15. FinalOdd = 1/VigProb.
6. **Format**: Return ONLY valid JSON array of objects.
   [{"marketName": "Total Corners", "selections": [{"label": "Over 10.5", "odds": 1.85}, {"label": "Under 10.5", "odds": 1.85}]}]
7. **Realism**: Odds must be realistic for the specific schools and sports mentioned.`
                        },
                        {
                            role: "user",
                            content: `Create markets for: ${matchDetails}`
                        }
                    ],
                    model: "gpt-4o",
                    temperature: 0.7, // Higher creativity
                    max_tokens: 1500
                })
            })

            if (!response.ok) {
                if (response.status === 429 || response.status === 401) {
                    await reportKeyError(token);
                    continue;
                }
                throw new Error(`AI request failed: ${response.status}`)
            }

            const result = await response.json() as { choices: Array<{ message: { content: string } }> }
            const content = result.choices[0]?.message?.content || "[]"

            // Extract JSON
            const jsonMatch = content.match(/\[[\s\S]*\]/)
            const jsonStr = jsonMatch ? jsonMatch[0] : "[]"

            return JSON.parse(jsonStr) as AIMarketSuggestion[]

        } catch (error) {
            console.error("AI Market Gen Error:", error)
            if (attempts >= maxAttempts) return [];
            await wait(1000);
        }
    }
    return []
}
