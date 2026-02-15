import { Match } from "./types";
import { AI_RISK_SETTINGS } from "./constants";

export interface VirtualSchool {
    name: string;
    region: string;
}

export const BEST_27_SCHOOLS = [
    "PRESEC Legon", "Prempeh College", "St. Peter's SHS", "Opoku Ware School",
    "Mfantsipim School", "St. Augustine's College", "Adisadel College",
    "Achimota School", "Accra Academy", "Koforidua Sec Tech (KSTS)",
    "Bishop Herman College", "Mawuli School", "Kumasi Academy",
    "St. James Sem. & SHS", "Archbishop Porter Girls'", "Wesley Girls' High School",
    "Holy Child School", "Aburi Girls' SHS", "St. Rose's SHS",
    "Mfantsiman Girls' SHS", "Tamale SHS", "Ghana National College",
    "University Practice SHS", "Pope John SHS", "Winneba SHS",
    "GSTS", "Kumasi High School"
];

export const DEFAULT_SCHOOLS: VirtualSchool[] = [
    { name: "Mfantsipim School", region: "Central" },
    { name: "St. Augustine's College", region: "Central" },
    { name: "Opoku Ware School", region: "Ashanti" },
    { name: "PRESEC Legon", region: "Greater Accra" },
    { name: "Achimota School", region: "Greater Accra" },
    { name: "Prempeh College", region: "Ashanti" },
    { name: "Accra Academy", region: "Greater Accra" },
    { name: "Adisadel College", region: "Central" },
    { name: "St. Peter's SHS", region: "Eastern" },
    // Expanded Regional Schools
    { name: "Kumasi High School", region: "Ashanti" },
    { name: "Kumasi Academy", region: "Ashanti" },
    { name: "Yaa Asantewaa Girls", region: "Ashanti" },
    { name: "St. Louis SHS", region: "Ashanti" },
    { name: "Tepa SHS", region: "Ashanti" },
    { name: "Toase SHS", region: "Ashanti" },
    { name: "Konongo Odumase SHS", region: "Ashanti" },
    { name: "Wesley Girls' High", region: "Central" },
    { name: "Holy Child School", region: "Central" },
    { name: "Mfantsiman Girls", region: "Central" },
    { name: "Ghana National College", region: "Central" },
    { name: "University Practice", region: "Central" },
    { name: "Winneba SHS", region: "Central" },
    { name: "Aburi Girls' SHS", region: "Eastern" },
    { name: "Pope John SHS", region: "Eastern" },
    { name: "Koforidua Sec Tech", region: "Eastern" },
    { name: "St. Rose's SHS", region: "Eastern" },
    { name: "Ofori Panin SHS", region: "Eastern" },
    { name: "St. Thomas Aquinas", region: "Greater Accra" },
    { name: "West Africa SHS", region: "Greater Accra" },
    { name: "Labone SHS", region: "Greater Accra" },
    { name: "Odorgonno SHS", region: "Greater Accra" },
    { name: "St. Mary's SHS", region: "Greater Accra" },
    { name: "Mawuli School", region: "Volta" },
    { name: "Bishop Herman College", region: "Volta" },
    { name: "Ola Girls SHS", region: "Volta" },
    { name: "Keta SHTS", region: "Volta" },
    { name: "Sogakope SHS", region: "Volta" },
    { name: "GSTS", region: "Western" },
    { name: "Archbishop Porter Girls", region: "Western" },
    { name: "St. John's School", region: "Western" },
    { name: "Fijai SHS", region: "Western" },
    { name: "Tamale SHS", region: "Northern" },
    { name: "Ghana Senior High", region: "Northern" },
    { name: "Northern School of Biz", region: "Northern" },
    { name: "St. Francis Xavier", region: "Upper West" },
    { name: "Notre Dame Sem", region: "Upper East" },
    { name: "St. James Sem.", region: "Bono" },
    { name: "Sunyani SHS", region: "Bono" }
];


export interface RoundScores {
    roundName: string;
    scores: [number, number, number];
}

export interface VirtualMatchOutcome {
    id: string;
    schools: [string, string, string];
    rounds: RoundScores[];
    totalScores: [number, number, number];
    winnerIndex: number;
    strengths: [number, number, number];
    category: 'regional' | 'national';
    queryRegion?: string;
    // New Stats for Extended Markets
    stats: {
        leadChanges: number;
        perfectRound: boolean[]; // [school1_perfect, school2_perfect, school3_perfect]
        shutoutRound: boolean[]; // [school1_shutout, school2_shutout, school3_shutout]
        firstBonusIndex: number; // 0, 1, 2
        fastestBuzzIndex: number; // 0, 1, 2
        lateSurgeIndex: number; // Winner of R4+R5
        strongStartIndex: number; // Winner of R1+R2
        highestRoundIndex: number; // 0=R1, 1=R2, ...
    };
    commentary: { time: number; text: string }[];
}

export interface VirtualResult {
    id: string;
    schools: [string, string, string];
    scores: [number, number, number];
    winner: string;
    time: string;
    rounds: RoundScores[];
    category: 'regional' | 'national';
    region?: string;
    roundId: number;
}

// Deterministic random based on seed
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

export function simulateMatch(
    roundId: number,
    index: number,
    schoolsList: VirtualSchool[] = DEFAULT_SCHOOLS,
    category: 'regional' | 'national' = 'national',
    queryRegion?: string,
    aiStrengths: Record<string, number> = {}, // New Param for AI Memory
    userSeed: number = 0 // New Param for Uniqueness per User
): VirtualMatchOutcome {
    const regionSlug = queryRegion ? queryRegion.toLowerCase().replace(/\s+/g, '-') : 'all';
    // Base seed for school selection (same for all matches in a round)
    const schoolSelectionSeed = (roundId * 1000) + (category === 'regional' ? 10000 : 20000) + userSeed + (queryRegion ? regionSlug.length : 0);
    // Unique seed for match results (unique per match index)
    const seed = schoolSelectionSeed + index;

    let selectedSchools: VirtualSchool[] = [];

    if (category === 'regional' && queryRegion) {
        let regionalSchools = schoolsList.filter(s => s.region.toLowerCase() === queryRegion.toLowerCase());

        // If regional schools is too small, fallback to neighbors
        if (regionalSchools.length < 3) {
            const NEIGHBOR_REGIONS: Record<string, string[]> = {
                'central': ['Western', 'Greater Accra', 'Ashanti'],
                'ashanti': ['Central', 'Bono', 'Eastern'],
                'greater accra': ['Central', 'Eastern', 'Volta'],
                'eastern': ['Greater Accra', 'Ashanti', 'Volta'],
                'volta': ['Greater Accra', 'Eastern', 'Northern'],
                'western': ['Central', 'Ashanti'],
                'northern': ['Volta', 'Bono', 'Upper East', 'Upper West'],
                'upper west': ['Northern'],
                'upper east': ['Northern'],
                'bono': ['Ashanti', 'Northern']
            };
            const neighbors = NEIGHBOR_REGIONS[queryRegion.toLowerCase()] || [];
            const neighborSchools = schoolsList.filter(s => neighbors.includes(s.region));
            regionalSchools = [...regionalSchools, ...neighborSchools];
        }

        if (regionalSchools.length < 3) {
            selectedSchools = [];
        } else {
            const shuffled = [...regionalSchools];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom(schoolSelectionSeed + i) * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            // Partition: pick 3 schools starting from index * 3
            const actualStart = (index * 3) % (Math.floor(shuffled.length / 3) * 3 || 3);
            selectedSchools = shuffled.slice(actualStart, actualStart + 3);

            // If wrap around happens or odd size, ensure we always have 3
            if (selectedSchools.length < 3) {
                selectedSchools = shuffled.slice(0, 3);
            }
        }
    }

    if (category === 'national' || selectedSchools.length < 3) {
        // Pick from BEST_27_SCHOOLS
        const bestSchools = schoolsList.filter(s => BEST_27_SCHOOLS.includes(s.name));
        const pool = bestSchools.length >= 3 ? bestSchools : schoolsList;

        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(schoolSelectionSeed + i) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Strategy: Partition the pool into unique triplets
        // For 27 schools, we have 9 unique triplets.
        const poolSize = shuffled.length;
        const tripletCount = Math.floor(poolSize / 3);
        const tripletIndex = index % tripletCount;
        const startIdx = tripletIndex * 3;

        selectedSchools = shuffled.slice(startIdx, startIdx + 3);
    }

    const schoolNames = selectedSchools.map(s => s.name) as [string, string, string];
    // Re-expanded strength variance: Check AI Memory first, else fallback to random
    const strengths = schoolNames.map((name, i) => {
        if (aiStrengths[name]) {
            const aiVal = aiStrengths[name];
            return aiVal + ((seededRandom(seed + i) * 0.2) - 0.1);
        }
        return 0.3 + (seededRandom(seed + i + 100) * 2.0);
    }) as [number, number, number];

    // Stats Tracking
    let leadChanges = 0;
    let currentLeaderIndex = -1;
    const cumulativeScores: [number, number, number] = [0, 0, 0];

    const perfectRound: boolean[] = [false, false, false]; // True if school had at least one perfect round
    const shutoutRound: boolean[] = [false, false, false]; // True if school had at least one shutout round

    // Simplified simulation for brevity but keeping the 5 rounds logic
    const roundNames = ["General", "Speed Race", "Problem of the Day", "True/False", "Riddles"];

    const finalRounds: RoundScores[] = roundNames.map((name, rIdx) => {
        const scores: [number, number, number] = [0, 0, 0];
        strengths.forEach((s, i) => {
            const rSeed = seed + i + rIdx * 100;
            const rand = seededRandom(rSeed);
            let roundScore = 0;

            // CHAOS FACTOR: AI Reduced from 15% to 5% to prevent "Black Swan" events
            // This ensures favorites win more consistently, protecting the house
            let effectiveStrength = s;
            if (seededRandom(rSeed + 999) < 0.05) {
                effectiveStrength = 3.0 - s; // Invert strength (approximate range flip)
            }

            // ROUND-SPECIFIC PERFORMANCE VARIANCE
            // Add a round modifier that can boost or reduce performance in specific rounds
            // This ensures R1 doesn't always dominate
            const roundModifierSeed = seededRandom(rSeed + 5000);
            let roundPerformanceMultiplier = 1.0;

            // 30% chance of "off day" in any round (0.5x-0.8x performance)
            if (roundModifierSeed < 0.30) {
                roundPerformanceMultiplier = 0.5 + (seededRandom(rSeed + 6000) * 0.3);
            }
            // 20% chance of "hot streak" in any round (1.2x-1.5x performance)
            else if (roundModifierSeed > 0.70) {
                roundPerformanceMultiplier = 1.2 + (seededRandom(rSeed + 7000) * 0.3);
            }

            // UNPREDICTABILITY: 90% randomness weighting (0.9 random, 0.1 strength)
            // Increased from 80/20 to make outcomes harder to predict purely on paper stats
            let performance = (effectiveStrength * 0.1) + (rand * 0.9);
            performance = performance * roundPerformanceMultiplier; // Apply round variance
            performance = Math.max(0, Math.min(1, performance)); // Clamp to [0,1]

            if (name === "General") {
                // ~10-15 questions, 3 pts each
                const correct = Math.floor(15 * performance);
                roundScore = correct * 3;
                if (correct === 15) perfectRound[i] = true;
            } else if (name === "Speed Race") {
                // ~5-8 questions, 3 pts each, -2 for wrong
                const correct = Math.floor(8 * performance);
                const wrong = Math.floor(2 * seededRandom(rSeed + 1));
                roundScore = Math.max(-5, (correct * 3) - (wrong * 2));
                if (correct === 8 && wrong === 0) perfectRound[i] = true;
            } else if (name === "Problem of the Day") {
                // Max 10 pts
                roundScore = Math.floor(10 * performance);
                if (roundScore === 10) perfectRound[i] = true;
            } else if (name === "True/False") {
                // 10 questions, 2 pts each, -1 for wrong
                // Even more randomness for T/F questions
                const correct = Math.floor(10 * performance);
                const wrong = Math.floor(3 * seededRandom(rSeed + 2));
                roundScore = Math.max(-2, (correct * 2) - (wrong * 1));
                if (correct === 10 && wrong === 0) perfectRound[i] = true;
            } else if (name === "Riddles") {
                // 4 riddles max
                const riddlesWon = Math.floor(4 * performance);
                roundScore = riddlesWon * 3;
                if (riddlesWon === 4) perfectRound[i] = true;
            }
            scores[i] = roundScore;

            if (roundScore === 0) shutoutRound[i] = true;
        });


        // Update cumulative scores and check for lead changes
        scores.forEach((s, i) => cumulativeScores[i] += s);
        const maxCumulative = Math.max(...cumulativeScores);
        const currentLeaders = cumulativeScores.map((s, i) => s === maxCumulative ? i : -1).filter(i => i !== -1);

        if (currentLeaders.length === 1) {
            if (currentLeaderIndex !== -1 && currentLeaders[0] !== currentLeaderIndex) {
                leadChanges++;
            }
            currentLeaderIndex = currentLeaders[0];
        } else if (currentLeaders.length > 1) {
            currentLeaderIndex = -1;
        }

        return { roundName: name, scores };
    });

    const totalScores: [number, number, number] = [0, 0, 0];
    finalRounds.forEach(r => {
        r.scores.forEach((s, i) => totalScores[i] += s);
    });

    let maxScore = Math.max(...totalScores);
    let tiedIndices = totalScores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);

    // Tie-breaker logic: Loop until a single unique winner is found
    if (tiedIndices.length > 1) {
        let attempts = 0;
        let uniqueWinnerFound = false;
        const cumulativeTieBreakerScores: [number, number, number] = [0, 0, 0];

        while (!uniqueWinnerFound && attempts < 10) { // Limit attempts to avoid infinite loop (safety)
            tiedIndices.forEach(idx => {
                const add = Math.floor(seededRandom(seed + (idx + attempts) * 777) * 5) + 1;
                cumulativeTieBreakerScores[idx] += add;
                totalScores[idx] += add;
            });

            maxScore = Math.max(...totalScores);
            const stillTied = totalScores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);

            if (stillTied.length === 1) {
                uniqueWinnerFound = true;
            } else {
                tiedIndices = stillTied; // Only tie-break among the remaining tied teams
                attempts++;
            }
        }

        finalRounds.push({
            roundName: "Tie Breaker",
            scores: cumulativeTieBreakerScores
        });
        maxScore = Math.max(...totalScores);
    }

    const winnerIndex = totalScores.indexOf(maxScore);

    // Calculate other props based on strengths/random for virtual determination
    const firstBonusIndex = Math.floor(seededRandom(seed + 999) * 3);
    const fastestBuzzIndex = Math.floor(seededRandom(seed + 888) * 3);

    // Award bonus points to totalScores
    totalScores[firstBonusIndex] += 3;
    totalScores[fastestBuzzIndex] += 5;

    const lateSurgeScores: [number, number, number] = [0, 0, 0];
    const strongStartScores: [number, number, number] = [0, 0, 0];

    finalRounds.forEach((r, idx) => {
        if (idx < 2) { // R1 + R2
            r.scores.forEach((s, i) => strongStartScores[i] += s);
        }
        if (idx >= 3 && idx < 5) { // R4 + R5 (assuming 5 main rounds)
            r.scores.forEach((s, i) => lateSurgeScores[i] += s);
        }
    });

    const lateSurgeIndex = lateSurgeScores.indexOf(Math.max(...lateSurgeScores));
    const strongStartIndex = strongStartScores.indexOf(Math.max(...strongStartScores));

    // Highest Scoring Round
    const roundSums = finalRounds.slice(0, 5).map(r => r.scores.reduce((a, b) => a + b, 0)); // Only consider main 5 rounds
    const highestRoundIndex = roundSums.indexOf(Math.max(...roundSums));

    // Generate Commentary Sequence
    const commentary: { time: number; text: string }[] = [];
    commentary.push({ time: 0, text: `Game Start! ${schoolNames[0]}, ${schoolNames[1]} and ${schoolNames[2]} take the stage.` });

    finalRounds.forEach((r, idx) => {
        if (idx >= 5) return; // Skip tie breaker in basic timeline
        const time = (idx + 1) * 10; // Events at 10, 20, 30, 40, 50s
        const roundMax = Math.max(...r.scores);
        const winners = r.scores.map((s, i) => s === roundMax ? i : -1).filter(i => i !== -1);

        if (winners.length === 1) {
            const school = schoolNames[winners[0]];
            const messages = [
                `${school} is on fire in ${r.roundName}!`,
                `Incredible performance by ${school} in the ${r.roundName} round.`,
                `${school} takes a decisive lead in ${r.roundName}.`,
                `${school} is showing pure class right now!`
            ];
            commentary.push({ time, text: messages[seededRandom(seed + idx) * messages.length | 0] });
        } else {
            commentary.push({ time, text: `It's a tight race in ${r.roundName}! Points shared.` });
        }

        // Add lead change commentary if it happened
        if (idx > 0 && idx < 5) {
            // We can check if leader changed here if we tracked it per round, but simple enough to just add variance
            if (seededRandom(seed + idx + 500) > 0.7) {
                commentary.push({ time: time + 5, text: "The crowd is going wild! What a match!" });
            }
        }
    });

    commentary.push({ time: 55, text: "We're in the final seconds! Every point counts!" });
    commentary.push({ time: 60, text: `Full Time! ${schoolNames[winnerIndex]} are the champions!` });

    return {
        id: `vmt-${roundId}-${index}-${category}-${regionSlug}`,
        schools: schoolNames,
        rounds: finalRounds,
        totalScores,
        winnerIndex,
        strengths,
        category,
        queryRegion,
        stats: {
            leadChanges,
            perfectRound,
            shutoutRound,
            firstBonusIndex,
            fastestBuzzIndex,
            lateSurgeIndex,
            strongStartIndex,
            highestRoundIndex
        },
        commentary
    };
}

// Master Table Logic for Odds Generation
// AI-POWERED ODDS GENERATION
// Uses heuristic logic to balance RTP and minimize house risk
function calculateSmartOdds(
    probability: number,
    baseMargin: number = 0.25,
    seed: number = 0,
    minOdds: number = 1.15,
    maxOdds: number = 6.00,
    noiseRange: number = 0.10
): number | null {
    if (!AI_RISK_SETTINGS.ENABLED) return null; // Fallback or strict mode

    // 1. DAMPENED NOISE: Reduce randomness to avoid accidental "Value Bets"
    const dampedNoise = (noiseRange * AI_RISK_SETTINGS.VOLATILITY_DAMPING);
    const noise = (seededRandom(seed) * dampedNoise) - (dampedNoise / 2);
    const probWithNoise = Math.max(0.01, Math.min(0.99, probability + noise));

    // 2. SMART MARGIN: Increase margin for lower probabilities (Riskier bets for house)
    // If prob is low (e.g. 0.1), risk is high => Increase margin
    const dynamicMargin = baseMargin * (1 + ((1 - probWithNoise) * (AI_RISK_SETTINGS.DYNAMIC_MARGIN_FACTOR - 1)));
    const adjustedProb = Math.min(0.95, probWithNoise * (1 + dynamicMargin));

    // 3. TARGET RTP ENFORCEMENT
    // Ensure the implied probability never drops below the Target RTP inverse
    // Standard Odds = 1 / P.  House Odds = Standard * RTP.
    const rawOdds = 1 / adjustedProb;
    const rtpControlledOdds = rawOdds * AI_RISK_SETTINGS.TARGET_RTP;

    // 4. CAPS & LIMITS
    const finalOdds = Math.max(minOdds, Math.min(AI_RISK_SETTINGS.MAX_ODDS_CAP, Math.min(maxOdds, rtpControlledOdds)));

    return Number(finalOdds.toFixed(2));
}

// Legacy wrapper to keep signature compatible if needed, but we replace usage
function calculateOddsFromProbability(
    probability: number,
    margin: number = 0.25,
    seed: number = 0,
    minOdds: number = 1.20,
    maxOdds: number = 6.00,
    noiseRange: number = 0.16
): number | null {
    return calculateSmartOdds(probability, margin, seed, minOdds, maxOdds, noiseRange);
}

export function mapOutcomeToMatch(outcome: VirtualMatchOutcome, startTimeMs: number): Match {
    // Sharpen probabilities
    const sharpenedStrengths = outcome.strengths.map(s => Math.pow(s, 1.8));
    const totalSharpened = sharpenedStrengths.reduce((a, b) => a + b, 0);

    const probA = sharpenedStrengths[0] / totalSharpened;
    const probB = sharpenedStrengths[1] / totalSharpened;
    const probC = sharpenedStrengths[2] / totalSharpened;

    const getPropOdds = (
        baseProb: number,
        volatility: number = 0.25,
        customMargin: number = 0.20,
        min: number = 1.20,
        max: number = 6.00
    ) => {
        const chaos = (seededRandom(startTimeMs + baseProb * 1000) - 0.5) * volatility;
        const finalProb = Math.max(0.01, Math.min(0.99, baseProb * (1 + chaos)));
        return calculateOddsFromProbability(finalProb, customMargin, startTimeMs + baseProb * 777, min, max);
    };

    // Tier 1: Match Winner
    const winnerMargin = 0.125;
    const oddsA = calculateOddsFromProbability(probA, winnerMargin, startTimeMs + 1, 1.10, 6.00, 0.12)!;
    const oddsB = calculateOddsFromProbability(probB, winnerMargin, startTimeMs + 2, 1.10, 6.00, 0.12)!;
    const oddsC = calculateOddsFromProbability(probC, winnerMargin, startTimeMs + 3, 1.10, 6.00, 0.12)!;

    // Projected Total
    const projectedTotal = outcome.strengths.reduce((a, b) => a + b, 0) * 45;
    const centerLine = Math.round(projectedTotal / 10) * 10 + 0.5;
    const lines = [centerLine - 20, centerLine - 10, centerLine, centerLine + 10, centerLine + 20];

    const totalPointsOdds: Record<string, number | null> = {};
    const totalMargin = 0.165;
    lines.forEach(line => {
        const diff = projectedTotal - line;
        const probOver = 1 / (1 + Math.exp(-diff / 35));
        totalPointsOdds[`Over ${line}`] = getPropOdds(probOver, 0.15, totalMargin, 1.20, 3.00);
        totalPointsOdds[`Under ${line}`] = getPropOdds(1 - probOver, 0.15, totalMargin, 1.20, 3.00);
    });

    // Winning Margin
    const strengths = outcome.strengths;
    const maxStrength = Math.max(...strengths);
    const strengthSpread = maxStrength - Math.min(...strengths);
    const shiftFactor = Math.min(1, strengthSpread / 1.5);

    const prob1_10 = 0.50 - (shiftFactor * 0.30);
    const prob11_25 = 0.35 + (shiftFactor * 0.10);
    const prob26_Plus = 0.15 + (shiftFactor * 0.20);

    const winningMarginOdds = {
        "1-10": getPropOdds(prob1_10, 0.20, 0.18, 1.20, 5.00),
        "11-25": getPropOdds(prob11_25, 0.20, 0.18, 1.20, 5.00),
        "26+": getPropOdds(prob26_Plus, 0.20, 0.18, 1.20, 5.00)
    };

    const getYesNoOdds = (yesProb: number) => ({
        "Yes": getPropOdds(yesProb, 0.25, 0.25, 1.10, 15.00),
        "No": getPropOdds(1 - yesProb, 0.25, 0.25, 1.10, 15.00)
    });

    const matchNoise = (seededRandom(startTimeMs) * 0.06) - 0.03;

    const getPerfectProb = (difficulty: number, rIdx: number = 0) => {
        const rNoise = (seededRandom(startTimeMs + rIdx * 555) * 0.08) - 0.04;
        let p = 0.15 + (maxStrength * 0.10) + matchNoise + rNoise;
        p = p * (1 - difficulty * 0.4);
        return Math.max(0.01, p);
    };

    const perfectRound1Odds = getYesNoOdds(getPerfectProb(0.3, 1));
    const perfectRound2Odds = getYesNoOdds(getPerfectProb(0.6, 2));
    const perfectRound3Odds = getYesNoOdds(getPerfectProb(0.8, 3));
    const perfectRound4Odds = getYesNoOdds(getPerfectProb(0.5, 4));
    const perfectRound5Odds = getYesNoOdds(getPerfectProb(0.7, 5));

    const anyPerfectProb = Math.min(0.40, getPerfectProb(0.3, 0) + getPerfectProb(0.6, 1) + getPerfectProb(0.5, 2));
    const perfectRoundOdds = getYesNoOdds(anyPerfectProb);

    const minStrength = Math.min(...outcome.strengths);
    const shutoutRoundProb = 0.12 + (minStrength < 0.8 ? 0.15 : 0) + matchNoise;
    const shutoutRoundOdds = getYesNoOdds(shutoutRoundProb);

    const getRoundWinnerOdds = (roundIndex: number) => {
        const rSeed = startTimeMs + (roundIndex * 777);
        const rNoise = (seededRandom(rSeed) * 0.16) - 0.08;
        const phaseMult = roundIndex >= 3 ? 1.05 : 0.95;

        return {
            [outcome.schools[0]]: getPropOdds(probA * phaseMult + rNoise, 0.25, 0.18, 1.15, 6.00),
            [outcome.schools[1]]: getPropOdds(probB * phaseMult + rNoise, 0.25, 0.18, 1.15, 6.00),
            [outcome.schools[2]]: getPropOdds(probC * phaseMult + rNoise, 0.25, 0.18, 1.15, 6.00),
        };
    };

    const firstBonusOdds = {
        [outcome.schools[0]]: getPropOdds(probA * 0.4 + 0.2),
        [outcome.schools[1]]: getPropOdds(probB * 0.4 + 0.2),
        [outcome.schools[2]]: getPropOdds(probC * 0.4 + 0.2),
    };

    const fastestBuzzOdds = {
        [outcome.schools[0]]: getPropOdds(probA * 0.5 + 0.16),
        [outcome.schools[1]]: getPropOdds(probB * 0.5 + 0.16),
        [outcome.schools[2]]: getPropOdds(probC * 0.5 + 0.16),
    };

    const comebackWinProb = 0.18 - (shiftFactor * 0.13);
    const comebackWinOdds = getYesNoOdds(comebackWinProb);
    const leadChangesHighProb = 0.65 - (shiftFactor * 0.40);
    const leadChangesOdds = {
        "Over 2.5": getPropOdds(leadChangesHighProb),
        "Under 2.5": getPropOdds(1 - leadChangesHighProb)
    };

    const comebackTeamOdds = {
        [outcome.schools[0]]: getPropOdds(probA * 0.3),
        [outcome.schools[1]]: getPropOdds(probB * 0.3),
        [outcome.schools[2]]: getPropOdds(probC * 0.3),
    }

    const lateSurgeOdds = {
        [outcome.schools[0]]: getPropOdds(probA, 0.4),
        [outcome.schools[1]]: getPropOdds(probB, 0.4),
        [outcome.schools[2]]: getPropOdds(probC, 0.4),
    };

    const strongStartOdds = {
        [outcome.schools[0]]: getPropOdds(probA, 0.1),
        [outcome.schools[1]]: getPropOdds(probB, 0.1),
        [outcome.schools[2]]: getPropOdds(probC, 0.1),
    };

    const highestPointsOdds = {
        [outcome.schools[0]]: getPropOdds(probA),
        [outcome.schools[1]]: getPropOdds(probB),
        [outcome.schools[2]]: getPropOdds(probC),
    };

    const leaderAfterRound1Odds = {
        [outcome.schools[0]]: getPropOdds(probA),
        [outcome.schools[1]]: getPropOdds(probB),
        [outcome.schools[2]]: getPropOdds(probC),
    };

    const round1WinnerOdds = getRoundWinnerOdds(0);
    const round2WinnerOdds = getRoundWinnerOdds(1);
    const round3WinnerOdds = getRoundWinnerOdds(2);
    const round4WinnerOdds = getRoundWinnerOdds(3);
    const round5WinnerOdds = getRoundWinnerOdds(4);

    const extendedOdds: Match['extendedOdds'] = {
        winningMargin: winningMarginOdds,
        totalPoints: totalPointsOdds,
        perfectRound: perfectRoundOdds,
        perfectRound1: perfectRound1Odds,
        perfectRound2: perfectRound2Odds,
        perfectRound3: perfectRound3Odds,
        perfectRound4: perfectRound4Odds,
        perfectRound5: perfectRound5Odds,
        shutoutRound: shutoutRoundOdds,
        leaderAfterRound1: leaderAfterRound1Odds,
        firstBonus: firstBonusOdds,
        fastestBuzz: fastestBuzzOdds,
        lateSurge: lateSurgeOdds,
        strongStart: strongStartOdds,
        highestPoints: highestPointsOdds,
        comebackWin: comebackWinOdds,
        comebackTeam: comebackTeamOdds,
        leadChanges: leadChangesOdds,
        round1Winner: round1WinnerOdds,
        round2Winner: round2WinnerOdds,
        round3Winner: round3WinnerOdds,
        round4Winner: round4WinnerOdds,
        round5Winner: round5WinnerOdds
    };

    return {
        id: outcome.id,
        participants: [
            { schoolId: `v-${outcome.schools[0]}`, name: outcome.schools[0], odd: oddsA },
            { schoolId: `v-${outcome.schools[1]}`, name: outcome.schools[1], odd: oddsB },
            { schoolId: `v-${outcome.schools[2]}`, name: outcome.schools[2], odd: oddsC },
        ],
        startTime: `Round ${Math.floor(startTimeMs / 60000)}`,
        isLive: false,
        isVirtual: true,
        stage: outcome.category === 'regional' ? "Regional Qualifier" : "National Championship",
        odds: {
            schoolA: oddsA,
            schoolB: oddsB,
            schoolC: oddsC
        },
        extendedOdds,
        sportType: "quiz",
        gender: "mixed",
        margin: winnerMargin
    };
}



export function generateVirtualMatches(
    count: number = 8,
    schoolsList: VirtualSchool[] = DEFAULT_SCHOOLS,
    roundId: number,
    category: 'regional' | 'national' | 'all' = 'national',
    queryRegion?: string,
    aiStrengths: Record<string, number> = {},
    userSeed: number = 0
): { matches: Match[], outcomes: VirtualMatchOutcome[] } {
    const matches: Match[] = [];
    const outcomes: VirtualMatchOutcome[] = [];
    const cycleTime = 60000;

    for (let i = 0; i < count; i++) {
        // If category is 'all', alternate between national and regional
        // Logic: national, regional, national, regional...
        const matchCategory: 'regional' | 'national' = category === 'all'
            ? (i % 2 === 0 ? 'national' : 'regional')
            : category;

        const outcome = simulateMatch(
            roundId,
            i,
            schoolsList,
            matchCategory,
            queryRegion,
            aiStrengths as Record<string, number>,
            userSeed
        );
        matches.push(mapOutcomeToMatch(outcome, roundId * cycleTime));
        outcomes.push(outcome);
    }

    return { matches, outcomes };
}

export function getVirtualMatchById(id: string, schoolsList: VirtualSchool[] = DEFAULT_SCHOOLS, userSeed: number = 0): Match | undefined {
    if (!id.startsWith("vmt-")) return undefined;
    const parts = id.split("-");
    if (parts.length < 3) return undefined;

    const roundId = parseInt(parts[1]);
    const index = parseInt(parts[2]);
    const category = (parts[3] as 'regional' | 'national') || 'national';
    const regionSlug = parts[4] || 'all';

    // Find regional name from slug (Reverse mapping or just pass slug if handled)
    const schoolsInThisRegion = schoolsList.find(s => s.region.toLowerCase().replace(/\s+/g, '-') === regionSlug);
    const regionName = schoolsInThisRegion?.region;

    const cycleTime = 60000;

    const outcome = simulateMatch(
        roundId,
        index,
        schoolsList,
        category as 'regional' | 'national',
        regionName,
        {} as Record<string, number>,
        userSeed
    );
    return mapOutcomeToMatch(outcome, roundId * cycleTime);
}

export function getRecentVirtualResults(
    count: number = 3,
    schoolsList: VirtualSchool[] = DEFAULT_SCHOOLS,
    roundId: number,
    category: 'regional' | 'national' | 'all' = 'national',
    queryRegion?: string,
    userSeed: number = 0
): VirtualResult[] {
    const results: VirtualResult[] = [];
    const cycleTime = 60000;

    for (let i = 1; i <= count; i++) {
        const id = roundId - i;
        const matchCategory: 'regional' | 'national' = category === 'all'
            ? (i % 2 === 0 ? 'national' : 'regional')
            : category;

        const outcome = simulateMatch(
            id,
            0,
            schoolsList,
            matchCategory,
            queryRegion,
            {} as Record<string, number>,
            userSeed
        );

        results.push({
            id: `vr-${id}-${matchCategory}-${queryRegion || 'all'}`,
            schools: outcome.schools,
            scores: outcome.totalScores,
            winner: outcome.schools[outcome.winnerIndex],
            time: new Date(id * cycleTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rounds: outcome.rounds,
            category: outcome.category,
            region: queryRegion,
            roundId: id
        });
    }

    return results;
}

export const getSchoolAcronym = (name: string, allParticipants: string[] = []) => {
    if (!name || typeof name !== 'string') return "";

    // Generate basic acronym
    const base = name
        .split(/[\s/-]+/)
        .map(word => word[0]?.toUpperCase())
        .join('');

    if (allParticipants.length <= 1) return base;

    // Check for collisions and identical names
    const acronyms: string[] = [];
    allParticipants.forEach((pName, pIdx) => {
        const ac = pName.split(/[\s/-]+/).map(w => w[0]?.toUpperCase()).join('');

        // Handle identical name collisions or acronym collisions
        let suffix = 0;
        let finalAc = ac;

        // Check if this specific name has appeared before in this list
        const occurrences = allParticipants.slice(0, pIdx).filter(n => n === pName).length;
        if (occurrences > 0) {
            suffix = occurrences;
            finalAc = `${ac}${suffix}`;
        }

        // Also check if this acronym conflicts with a DIFFERENT school's acronym
        while (acronyms.includes(finalAc)) {
            suffix++;
            finalAc = `${ac}${suffix}`;
        }

        acronyms.push(finalAc);
    });

    const myIndex = allParticipants.indexOf(name);
    return acronyms[myIndex] || base;
}

export function calculateTotalOdds(selections: { odds: number }[]) {
    if (selections.length === 0) return 0;
    const raw = selections.reduce((acc, s) => acc * s.odds, 1);
    return raw;
}

export interface VirtualSelection {
    matchId: string;
    selectionId: string;
    label: string;
    odds: number;
    marketName: string;
    matchLabel: string;
    schoolA: string;
    schoolB: string;
    schoolC: string;
    stakeUsed?: number;
}

export interface ResolvedSelection extends VirtualSelection {
    won: boolean;
    outcome: VirtualMatchOutcome;
}

export interface ClientVirtualBet {
    id: string;
    selections: (VirtualSelection | ResolvedSelection)[];
    stake: number;
    potentialPayout: number;
    status: string;
    timestamp: number;
    roundId: number;
    time?: string;
    mode?: string; // 'single' | 'multi' | 'system'
    totalStake: number;
    totalOdds: number;
    combinations?: { selections: VirtualSelection[]; odds: number }[];
    stakePerCombo?: number;
    cashedOut?: boolean;
    totalReturns?: number;
    results?: ResolvedSelection[];
}

export interface ResolvedSlip extends ClientVirtualBet {
    combinations?: {
        selections: ResolvedSelection[];
        won: boolean;
        return: number;
        odds: number;
    }[];
    results: ResolvedSelection[];
    totalReturns: number;
}

export const getTicketId = (id: string | number | undefined) => {
    if (!id) return "---";
    return `VR-${id.toString().slice(-6)}`;
}

export const normalizeSchoolName = (name: string) => {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

// Helper for checking wins across all 14 markets
export const checkSelectionWin = (selection: VirtualSelection, outcome: VirtualMatchOutcome) => {
    if (!outcome) return false;

    const { marketName, label } = selection;

    if (marketName === "Match Winner") {
        const winner = outcome.schools[outcome.winnerIndex];
        // Map "1", "2", "3" to the actual school name
        let predictedWinner = label;
        if (label === "1") predictedWinner = outcome.schools[0];
        if (label === "2") predictedWinner = outcome.schools[1];
        if (label === "3") predictedWinner = outcome.schools[2];

        return normalizeSchoolName(predictedWinner) === normalizeSchoolName(winner);
    }

    if (marketName === "Total Points") {
        const total = outcome.totalScores.reduce((a, b) => a + b, 0);
        const line = parseFloat(label.split(' ')[1]);
        const type = label.split(' ')[0];
        return type === "Over" ? total > line : total < line;
    }

    if (marketName === "Winning Margin") {
        const sorted = [...outcome.totalScores].sort((a, b) => b - a);
        const margin = sorted[0] - sorted[1];
        if (label === "1-10") return margin >= 1 && margin <= 10;
        if (label === "11-25") return margin >= 11 && margin <= 25;
        if (label === "26+") return margin >= 26;
    }


    if (marketName === "Perfect Round") {
        // Any round perfect
        const isPerfect = outcome.stats.perfectRound.some(p => p);
        return label === "Yes" ? isPerfect : !isPerfect;
    }

    // Handle Per-Round Perfect Markets
    if (marketName.startsWith("Perfect Round ")) {
        const roundNum = parseInt(marketName.split(" ")[2]); // "Perfect Round 1" -> 1
        if (!isNaN(roundNum)) {
            const roundIndex = roundNum - 1;
            const isPerfect = outcome.stats.perfectRound[roundIndex];
            return label === "Yes" ? isPerfect : !isPerfect;
        }
    }

    if (marketName === "Shutout Round") {
        const isShutout = outcome.stats.shutoutRound.some(s => s);
        return label === "Yes" ? isShutout : !isShutout;
    }

    if (marketName.includes("Winner")) {
        // "Round 1 Winner" -> "Round 1"
        const roundNum = parseInt(marketName.split(" ")[1]);
        const roundIndex = roundNum - 1;
        const roundScores = outcome.rounds[roundIndex].scores;
        const maxScore = Math.max(...roundScores);
        const winnerIdx = roundScores.indexOf(maxScore);

        // Check for draw in round
        const winnersCount = roundScores.filter(s => s === maxScore).length;
        if (winnersCount > 1) return false; // Draw = Lost for now

        let predictedWinner = label;
        if (label === "1") predictedWinner = outcome.schools[0];
        if (label === "2") predictedWinner = outcome.schools[1];
        if (label === "3") predictedWinner = outcome.schools[2];

        return normalizeSchoolName(predictedWinner) === normalizeSchoolName(outcome.schools[winnerIdx]);
    }

    if (marketName === "First Bonus") {
        let predictedWinner = label;
        if (label === "1") predictedWinner = outcome.schools[0];
        if (label === "2") predictedWinner = outcome.schools[1];
        if (label === "3") predictedWinner = outcome.schools[2];
        return normalizeSchoolName(predictedWinner) === normalizeSchoolName(outcome.schools[outcome.stats.firstBonusIndex]);
    }

    if (marketName === "Fastest Buzz") {
        let predictedWinner = label;
        if (label === "1") predictedWinner = outcome.schools[0];
        if (label === "2") predictedWinner = outcome.schools[1];
        if (label === "3") predictedWinner = outcome.schools[2];
        return normalizeSchoolName(predictedWinner) === normalizeSchoolName(outcome.schools[outcome.stats.fastestBuzzIndex]);
    }

    if (marketName === "Comeback Win") {
        const isComeback = outcome.winnerIndex !== outcome.stats.strongStartIndex && outcome.stats.leadChanges > 0;
        return label === "Yes" ? isComeback : !isComeback;
    }

    if (marketName === "Comeback Team") {
        const isComeback = outcome.winnerIndex !== outcome.stats.strongStartIndex && outcome.stats.leadChanges > 0;
        const comebackWinner = isComeback ? outcome.schools[outcome.winnerIndex] : "None";
        return normalizeSchoolName(label) === normalizeSchoolName(comebackWinner);
    }

    if (marketName === "Lead Changes") {
        const line = 2.5;
        const changes = outcome.stats.leadChanges;
        const type = label.split(' ')[0];
        return type === "Over" ? changes > line : changes < line;
    }

    if (marketName === "Late Surge") {
        return normalizeSchoolName(label) === normalizeSchoolName(outcome.schools[outcome.stats.lateSurgeIndex]);
    }

    if (marketName === "Strong Start") {
        return normalizeSchoolName(label) === normalizeSchoolName(outcome.schools[outcome.stats.strongStartIndex]);
    }

    if (marketName === "Highest Points") {
        // Total winner
        return normalizeSchoolName(label) === normalizeSchoolName(outcome.schools[outcome.winnerIndex]);
    }

    if (marketName === "Leader After Round 1") {
        // Check scores after R1
        const r1Scores = outcome.rounds[0].scores;
        const max = Math.max(...r1Scores);
        const winnerIdx = r1Scores.indexOf(max);
        // Handle draw?
        const winnersCount = r1Scores.filter(s => s === max).length;
        if (winnersCount > 1) return false;

        return normalizeSchoolName(label) === normalizeSchoolName(outcome.schools[winnerIdx]);
    }

    if (marketName === "Highest Scoring Round" || marketName === "Highest Round") {
        // Label: "Round 1", "Rounds 2 & 3", "Rounds 4 & 5"
        // Logic from manual implementation:
        // Calculate phases
        const rScore = (rIdx: number) => outcome.rounds[rIdx].scores.reduce((a, b) => a + b, 0);
        const p1 = rScore(0);
        const p2 = rScore(1) + rScore(2);
        const p3 = rScore(3) + rScore(4);

        const max = Math.max(p1, p2, p3);
        let winningPhase = "Round 1";
        if (p2 === max) winningPhase = "Rounds 2 & 3";
        if (p3 === max) winningPhase = "Rounds 4 & 5";

        // Handle ties? Prefer later rounds? Or "Draw"? 
        // Existing logic in Client rendered "Round 1" fallback. 
        // Let's assume strict equality on label.
        return label === winningPhase;
    }

    return false;
}
