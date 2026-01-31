import { Match } from "./types";

export interface VirtualSchool {
    name: string;
    region: string;
}

const DEFAULT_SCHOOLS: VirtualSchool[] = [
    { name: "Mfantsipim School", region: "Central" },
    { name: "St. Augustine's College", region: "Central" },
    { name: "Opoku Ware School", region: "Ashanti" },
    { name: "PRESEC Legon", region: "Greater Accra" },
    { name: "Achimota School", region: "Greater Accra" },
    { name: "Prempeh College", region: "Ashanti" },
    { name: "Accra Academy", region: "Greater Accra" },
    { name: "Adisadel College", region: "Central" },
    { name: "St. Peter's SHS", region: "Eastern" }
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
    }
}

export interface VirtualResult {
    id: string;
    schools: [string, string, string];
    scores: [number, number, number];
    winner: string;
    time: string;
    rounds: RoundScores[];
    category: 'regional' | 'national';
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
    category: 'regional' | 'national' = 'national'
): VirtualMatchOutcome {
    const seed = (roundId * 100) + index + (category === 'regional' ? 10000 : 20000);

    let selectedSchools: VirtualSchool[] = [];

    if (category === 'regional') {
        const regions = [...new Set(schoolsList.map(s => s.region))];
        const selectedRegion = regions[Math.floor(seededRandom(seed) * regions.length)];
        const regionalSchools = schoolsList.filter(s => s.region === selectedRegion);

        if (regionalSchools.length >= 3) {
            const shuffled = [...regionalSchools];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom(seed + i) * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            selectedSchools = shuffled.slice(0, 3);
        } else {
            category = 'national';
        }
    }

    if (category === 'national' || selectedSchools.length < 3) {
        const shuffled = [...schoolsList];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        selectedSchools = shuffled.slice(0, 3);
    }

    const schoolNames = selectedSchools.map(s => s.name) as [string, string, string];
    // Re-expanded strength variance: 0.3 to 2.3 for clear paper favorites
    const strengths = schoolNames.map((_, i) => 0.3 + (seededRandom(seed + i + 100) * 2.0)) as [number, number, number];

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

            // CHAOS FACTOR: 15% chance to completely invert/shuffle effective strengths for this round
            // This simulates underdogs having a "good day" or favorites choking
            let effectiveStrength = s;
            if (seededRandom(rSeed + 999) < 0.15) {
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

    // Late Surge (R4 + R5) & Strong Start (R1 + R2)
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

    return {
        id: `vmt-${roundId}-${index}-${category}`,
        schools: schoolNames,
        rounds: finalRounds,
        totalScores,
        winnerIndex,
        strengths,
        category,
        stats: {
            leadChanges,
            perfectRound,
            shutoutRound,
            firstBonusIndex,
            fastestBuzzIndex,
            lateSurgeIndex,
            strongStartIndex,
            highestRoundIndex
        }
    };
}

// Master Table Logic for Odds Generation
function calculateOddsFromProbability(
    probability: number,
    margin: number = 0.25,
    seed: number = 0,
    minOdds: number = 1.20,
    maxOdds: number = 6.00,
    noiseRange: number = 0.16 // ±8% default
): number | null {
    // 🎲 Randomized Noise (Increased to ±8% for "twist")
    const noise = (seededRandom(seed) * noiseRange) - (noiseRange / 2);
    const probabilityWithNoise = Math.max(0.01, Math.min(0.99, probability + noise));

    // HOUSE EDGE: Reduce the probability to increase the house advantage
    const adjustedProb = Math.min(0.95, probabilityWithNoise * (1 + margin));

    // Calculate fair odds from adjusted probability
    const rawOdds = 1 / adjustedProb;

    // 💰 10% REDUCTION (Balanced safety)
    const reducedOdds = rawOdds * 0.90;

    // 🔒 SAFETY CAPS (Dynamic per market)
    const finalOdds = Math.max(minOdds, Math.min(maxOdds, reducedOdds));

    return Number(finalOdds.toFixed(2));
}

export function mapOutcomeToMatch(outcome: VirtualMatchOutcome, startTimeMs: number): Match {
    // Sharpen probabilities
    const sharpenedStrengths = outcome.strengths.map(s => Math.pow(s, 1.8));
    const totalSharpened = sharpenedStrengths.reduce((a, b) => a + b, 0);

    const probA = sharpenedStrengths[0] / totalSharpened;
    const probB = sharpenedStrengths[1] / totalSharpened;
    const probC = sharpenedStrengths[2] / totalSharpened;

    // Helper for prop odds
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
        [outcome.schools[2]]: getPropOdds(probC * 0.4 + 0.2)
    };

    const fastestBuzzOdds = {
        [outcome.schools[0]]: getPropOdds(probA * 0.5 + 0.16),
        [outcome.schools[1]]: getPropOdds(probB * 0.5 + 0.16),
        [outcome.schools[2]]: getPropOdds(probC * 0.5 + 0.16)
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
    roundId: number
): Match[] {
    const matches: Match[] = [];
    const cycleTime = 60000; // 1 minute cycle

    for (let i = 0; i < count; i++) {
        const category = i < count / 2 ? 'regional' : 'national';
        const outcome = simulateMatch(roundId, i, schoolsList, category);
        matches.push(mapOutcomeToMatch(outcome, roundId * cycleTime));
    }

    return matches;
}

export function getVirtualMatchById(id: string, schoolsList: VirtualSchool[] = DEFAULT_SCHOOLS): Match | undefined {
    if (!id.startsWith("vmt-")) return undefined;
    const parts = id.split("-");
    if (parts.length < 3) return undefined;

    const roundId = parseInt(parts[1]);
    const index = parseInt(parts[2]);
    const category = (parts[3] as 'regional' | 'national') || 'national';
    const cycleTime = 60000;

    const outcome = simulateMatch(roundId, index, schoolsList, category);
    return mapOutcomeToMatch(outcome, roundId * cycleTime);
}

export function getRecentVirtualResults(count: number = 3, schoolsList: VirtualSchool[] = DEFAULT_SCHOOLS, roundId: number): VirtualResult[] {
    const results: VirtualResult[] = [];
    const cycleTime = 60000;

    for (let i = 1; i <= count; i++) {
        const id = roundId - i;
        (['regional', 'national'] as const).forEach(cat => {
            const outcome = simulateMatch(id, 0, schoolsList, cat);

            results.push({
                id: `vr-${id}-${cat}`,
                schools: outcome.schools,
                scores: outcome.totalScores,
                winner: outcome.schools[outcome.winnerIndex],
                time: new Date(id * cycleTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                rounds: outcome.rounds,
                category: outcome.category,
                roundId: id
            });
        })
    }

    return results;
}
