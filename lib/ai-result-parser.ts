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

export async function parseResultsWithAI(text: string, matchContext?: string): Promise<ParsedResult[]> {
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
1. Return ONLY a valid JSON array. No conversational text.
2. If match results are ambiguous or if the user asks you to "generate" or "predict" outcomes, use the provided Market Context (Odds/Strengths) as the primary guide.
3. Lower odds (favorites) should generally correspond to better performances/winners unless the text says otherwise.
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
5. If the user's text seems to be a command (e.g. "Create results for today"), generate realistic results based ON THE MARKET CONTEXT PROVIDED.`
                        },
                        {
                            role: "user",
                            content: `Market Context (Published Odds & Matches):\n${matchContext || "Not provided"}\n\nExtraction/Generation Task:\n${text}`
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
    helpInfo: string
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
                            content: `You are a professional sports bookmaker setting betting markets for a real campus tournament match.
You will receive a structured data block containing: TOURNAMENT STANDINGS, TEAM FORM & STATS, HEAD-TO-HEAD history, and SPORT-SPECIFIC TOURNAMENT STATS.
You MUST use ALL of this data to generate every single market and every single odd. Never use generic defaults.

═══════════════════════════════════════════════
UNIVERSAL RULES (apply to every sport):
═══════════════════════════════════════════════
1. **Standings determine Match Winner pricing.** The team higher in the standings (more points, better GD/margin, better form [W/D/L string]) MUST receive a lower "Match Winner" odd. Never price Team 1 as favourite just because they are listed first.
2. **Probability must be proportional to standing gap.** If one team has 9 pts and the other has 2 pts, the favourite should reflect that gap clearly (e.g. 1.45 vs 3.20, not 1.90 vs 1.95).
3. **Head-to-head history matters.** If the H2H shows one team always wins, factor that into both Match Winner and Handicap markets.

═══════════════════════════════════════════════
FOOTBALL & HANDBALL RULES:
═══════════════════════════════════════════════
- **Draw odds:** Calculate from the tournament DRAW RATE. Draw rate 40% → Draw odds ≈ 2.40-2.60. Draw rate 15% → Draw odds ≈ 5.50-6.50. NEVER use a fixed 3.20.
- **Total Goals (O/U):** Base every O/U line on AVG GOALS/GAME. Avg 1.2 goals → Over 2.5 is a long price (2.50+). Avg 2.8 goals → Over 2.5 is short (1.50-1.70). Scale accordingly.
- **Both Teams to Score:** Price from BTTS RATE. BTTS 60% → Yes ≈ 1.60-1.70, No ≈ 2.10-2.30. BTTS 25% → Yes ≈ 3.20-3.50, No ≈ 1.30-1.40.
- **Clean Sheet / Team Goals:** Use each team's Avg goals scored and conceded to price team-specific markets.
- **Core markets:** Match Winner (1X2 with Draw), Double Chance, Total Points, Both Teams to Score, Handicap.

═══════════════════════════════════════════════
BASKETBALL RULES:
═══════════════════════════════════════════════
- **Match Winner:** No draw in basketball. Price only Team 1 Win / Team 2 Win based on standings and avg points.
- **Total Points (O/U):** Use AVG TOTAL POINTS/GAME as the anchor for O/U lines. If avg is 110pts, set lines around 105.5, 110.5, 115.5.
- **Handicap:** If one team averages 20+ pts more per game than the other, offer a meaningful spread (e.g. -15.5 / +15.5). Base spread on AVG WINNING MARGIN.
- **Close game (margin ≤5 pts):** If many close games, lower the Handicap spread; if blowouts dominate, widen it.
- **Core markets:** Match Winner, Total Points, Handicap, First Half Winner.

═══════════════════════════════════════════════
VOLLEYBALL RULES:
═══════════════════════════════════════════════
- **Match Winner:** Price based on standings. Strong teams (more sets won avg) get lower odds.
- **Total Sets:** Use AVG SETS/MATCH to set lines (e.g. if avg is 3.8 sets, Over 3.5 is short, Under 4.5 is short).
- **Correct Score (Sets):** Offer 3-0, 3-1, 3-2 markets. Price 3-0 lower for dominant teams (higher straight-set win %).
- **Core markets:** Match Winner, Total Sets, Correct Score (Sets), Set 1 Winner.

═══════════════════════════════════════════════
QUIZ RULES:
═══════════════════════════════════════════════
- **Match Winner:** Based on standings (points/form). Teams with high avg quiz scores get lower odds.
- **Handicap:** Base spread on AVG WINNING MARGIN. Large margin → large spread (e.g. -15 / +15).
- **Total Points:** Use AVG TOTAL POINTS/MATCH to set O/U lines.
- **Core markets:** Match Winner, Handicap, Total Points, Winning Margin Range (e.g. 1-10, 11-20, 21+ pts).

═══════════════════════════════════════════════
FORMAT (all sports):
═══════════════════════════════════════════════
Return ONLY a valid JSON array. Each market is one object with marketName, helpInfo, and selections array:
[
  {"marketName": "Match Winner", "helpInfo": "Predict the match winner.", "selections": [{"label": "EXACT TEAM NAME 1", "odds": 1.65}, {"label": "Draw", "odds": 3.10}, {"label": "EXACT TEAM NAME 2", "odds": 5.00}]},
  {"marketName": "Total Points", "helpInfo": "Will there be over or under X goals?", "selections": [{"label": "Over 1.5", "odds": 1.28}, {"label": "Under 1.5", "odds": 3.40}, {"label": "Over 2.5", "odds": 2.10}, {"label": "Under 2.5", "odds": 1.72}]},
  {"marketName": "Both Teams to Score", "helpInfo": "Will both teams score?", "selections": [{"label": "Yes", "odds": 1.75}, {"label": "No", "odds": 2.00}]}
]
CRITICAL: Use the EXACT team names from the match description. Do NOT abbreviate or change them.`
                        },
                        {
                            role: "user",
                            content: `Already Listed Markets: ${existingMarkets.join(", ")}.
                            Create a full suite of markets (Standard + Specials) for: ${matchDetails}
                            
                            REMEMBER: Your "Match Winner" labels MUST EXACTLY match the team names provided above.`
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
