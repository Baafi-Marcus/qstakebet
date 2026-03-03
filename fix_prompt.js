
const fs = require('fs');
const path = require('path');

const filepath = path.join('c:', 'Users', 'marcu', 'Desktop', 'QSTAKEbet', 'qstakebet', 'lib', 'ai-result-parser.ts');

if (!fs.existsSync(filepath)) {
    console.error("File not found:", filepath);
    process.exit(1);
}

let content = fs.readFileSync(filepath, 'utf8');

const target = `                            content: \`You are a professional sports bookmaker for a diverse campus tournament. Generate 3-5 creative, high-engagement betting markets for this match.
                        
Rules:
1. **Sport Awareness**: The tournament includes Football, Basketball, Athletics, and Quiz competitions. Tailor your suggestions to the specific sport mentioned. Ensure you adapt your odds and market realism based on whether the match involves Senior High Schools (SHS) or Universities (Uni).
2. **Standard Keys**: For common markets, use these EXACT keys in your JSON object:
   - 'handicap' -> for point spreads/handicaps
   - 'totalPoints' -> for over/under totals
   - 'podium' -> for Top 3 finishes (Athletics)
   - 'h2h' -> for head-to-head matchups
3. **Specials**: You can create unique keys for special markets (e.g., 'firstTeamToScore', 'mostRiddlesSolved').
4. **Context Aware**: Do NOT suggest markets that are already listed: \${existingMarkets.join(", ")}.
5. **Profitability**: You MUST build in a **15% House Margin (Vig)** into the odds. The implied probability of all options in a market should sum to ~115%.
   - Formula: FairProb = 1/FairOdd. VigProb = FairProb * 1.15. FinalOdd = 1/VigProb.
6. **Tooltips (helpInfo)**: For EVERY market you generate, you MUST provide a short, 1-sentence 'helpInfo' explanation of how that market works to help novice bettors understand what they are betting on.
7. **Format**: Return ONLY valid JSON array of objects.
   [{"marketName": "Total Corners", "helpInfo": "Predict if the total number of corners will be over or under 10.5.", "selections": [{"label": "Over 10.5", "odds": 1.85}, {"label": "Under 10.5", "odds": 1.85}]}]
8. **Realism**: Odds must be realistic for the specific schools, ages, and sports mentioned.
9. **Tournament Awareness**: Use the provided 'Tournament Context' (recent results) to influence your markets. For example, if a team has been scoring high, suggest 'Over' markets or 'Next Goal' specials for them. If a team is on a losing streak, adjust their odds and suggest 'Double Chance' for their opponents.\``;

const replacement = `                            content: \`You are a professional sports bookmaker. Your task is to generate a robust suite of betting markets for a campus tournament match.
                        
Rules:
1. **Core Standards**: ALWAYS suggest 'matchWinner' (1X2), 'doubleChance', and MULTIPLE 'overUnder' lines (e.g., 0.5, 1.5, 2.5, 3.5).
2. **Sport Specifics**: The tournament includes Football, Basketball, Athletics, and Quiz. Tailor your suggestions to the sport and the level (SHS vs University).
3. **Advanced Keys**: For specific markets, use these keys: 'handicap' (point spreads), 'totalPoints' (O/U totals), 'podium' (Top 3 for Athletics), 'h2h' (head-to-head).
4. **Market Depth**: For 'overUnder', generate at least 3 different goal/point lines to give users choice.
5. **Profitability**: Build in a 15% House Margin (Vig). Final probability of all options should sum to ~1.15.
6. **Tooltips**: Provide a 1-sentence 'helpInfo' for every market.
7. **Alternative Logic**: You can suggest alternatives/improvements for existing markets if your analysis warrants it.
8. **Format**: Return ONLY a valid JSON array of objects.
   [{"marketName": "Match Winner", "helpInfo": "Predict the winner or a draw.", "selections": [{"label": "Team A", "odds": 1.85}, {"label": "Draw", "odds": 3.40}, {"label": "Team B", "odds": 4.20}]}]\``;

// Exact match check
if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log("Successfully replaced content (Exact Match)");
} else {
    console.log("Exact match FAILED. Trying fuzzy match...");

    const lines = content.split(/\\r?\\n/);
    const targetLines = target.split(/\\r?\\n/);

    let found = false;
    for (let i = 0; i <= lines.length - targetLines.length; i++) {
        let match = true;
        for (let j = 0; j < targetLines.length; j++) {
            if (lines[i + j].trim() !== targetLines[j].trim()) {
                match = false;
                break;
            }
        }
        if (match) {
            const newLines = [
                ...lines.slice(0, i),
                ...replacement.split(/\\n/),
                ...lines.slice(i + targetLines.length)
            ];
            fs.writeFileSync(filepath, newLines.join('\\n'), 'utf8');
            console.log("Successfully replaced content (Fuzzy Match)");
            found = true;
            break;
        }
    }

    if (!found) {
        console.error("Fuzzy match also FAILED");
        // Log some lines for comparison
        console.log("Sample file line:", lines[268]);
        console.log("Sample target line:", targetLines[0]);
    }
}
