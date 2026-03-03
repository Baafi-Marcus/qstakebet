
import os

filepath = r"c:\Users\marcu\Desktop\QSTAKEbet\qstakebet\lib\ai-result-parser.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = """                            content: `You are a professional sports bookmaker for a diverse campus tournament. Generate 3-5 creative, high-engagement betting markets for this match.
                        
Rules:
1. **Sport Awareness**: The tournament includes Football, Basketball, Athletics, and Quiz competitions. Tailor your suggestions to the specific sport mentioned. Ensure you adapt your odds and market realism based on whether the match involves Senior High Schools (SHS) or Universities (Uni).
2. **Standard Keys**: For common markets, use these EXACT keys in your JSON object:
   - 'handicap' -> for point spreads/handicaps
   - 'totalPoints' -> for over/under totals
   - 'podium' -> for Top 3 finishes (Athletics)
   - 'h2h' -> for head-to-head matchups
3. **Specials**: You can create unique keys for special markets (e.g., 'firstTeamToScore', 'mostRiddlesSolved').
4. **Context Aware**: Do NOT suggest markets that are already listed: ${existingMarkets.join(", ")}.
5. **Profitability**: You MUST build in a **15% House Margin (Vig)** into the odds. The implied probability of all options in a market should sum to ~115%.
   - Formula: FairProb = 1/FairOdd. VigProb = FairProb * 1.15. FinalOdd = 1/VigProb.
6. **Tooltips (helpInfo)**: For EVERY market you generate, you MUST provide a short, 1-sentence 'helpInfo' explanation of how that market works to help novice bettors understand what they are betting on.
7. **Format**: Return ONLY valid JSON array of objects.
   [{"marketName": "Total Corners", "helpInfo": "Predict if the total number of corners will be over or under 10.5.", "selections": [{"label": "Over 10.5", "odds": 1.85}, {"label": "Under 10.5", "odds": 1.85}]}]
8. **Realism**: Odds must be realistic for the specific schools, ages, and sports mentioned.
9. **Tournament Awareness**: Use the provided 'Tournament Context' (recent results) to influence your markets. For example, if a team has been scoring high, suggest 'Over' markets or 'Next Goal' specials for them. If a team is on a losing streak, adjust their odds and suggest 'Double Chance' for their opponents.`"""

replacement = """                            content: `You are a professional sports bookmaker. Your task is to generate a robust suite of betting markets for a campus tournament match.
                        
Rules:
1. **Core Standards**: ALWAYS suggest 'matchWinner' (1X2), 'doubleChance', and MULTIPLE 'overUnder' lines (e.g., 0.5, 1.5, 2.5, 3.5).
2. **Sport Specifics**: The tournament includes Football, Basketball, Athletics, and Quiz. Tailor your suggestions to the sport and the level (SHS vs University).
3. **Advanced Keys**: For specific markets, use these keys: 'handicap' (point spreads), 'totalPoints' (O/U totals), 'podium' (Top 3 for Athletics), 'h2h' (head-to-head).
4. **Market Depth**: For 'overUnder', generate at least 3 different goal/point lines to give users choice.
5. **Profitability**: Build in a 15% House Margin (Vig). Final probability of all options should sum to ~1.15.
6. **Tooltips**: Provide a 1-sentence 'helpInfo' for every market.
7. **Alternative Logic**: You can suggest alternatives/improvements for existing markets if your analysis warrants it.
8. **Format**: Return ONLY a valid JSON array of objects.
   [{"marketName": "Match Winner", "helpInfo": "Predict the winner or a draw.", "selections": [{"label": "Team A", "odds": 1.85}, {"label": "Draw", "odds": 3.40}, {"label": "Team B", "odds": 4.20}]}]`"""

if target in content:
    new_content = content.replace(target, replacement)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced content")
else:
    print("Target NOT FOUND in file")
    # Try a more fuzzy match by ignoring whitespace differences in lines
    lines = content.splitlines()
    target_lines = target.splitlines()
    
    found = False
    for i in range(len(lines) - len(target_lines) + 1):
        match = True
        for j in range(len(target_lines)):
            if lines[i+j].strip() != target_lines[j].strip():
                match = False
                break
        if match:
            # Reconstruct content with replacement
            new_lines = lines[:i] + replacement.splitlines() + lines[i+len(target_lines):]
            with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
                f.write('\n'.join(new_lines))
            print("Successfully replaced content (fuzzy match)")
            found = True
            break
    if not found:
        print("Fuzzy match also FAILED")
