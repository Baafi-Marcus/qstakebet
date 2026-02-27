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
    { name: "Wesley Girls' High School", region: "Central" },
    { name: "Holy Child School", region: "Central" },
    { name: "Mfantsiman Girls' SHS", region: "Central" },
    { name: "Ghana National College", region: "Central" },
    { name: "University Practice SHS", region: "Central" },
    { name: "Winneba SHS", region: "Central" },
    { name: "Aburi Girls' SHS", region: "Eastern" },
    { name: "Pope John SHS", region: "Eastern" },
    { name: "Koforidua Sec Tech (KSTS)", region: "Eastern" },
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
    { name: "Archbishop Porter Girls'", region: "Western" },
    { name: "St. John's School", region: "Western" },
    { name: "Fijai SHS", region: "Western" },
    { name: "Tamale SHS", region: "Northern" },
    { name: "Ghana Senior High", region: "Northern" },
    { name: "Northern School of Biz", region: "Northern" },
    { name: "St. Francis Xavier", region: "Upper West" },
    { name: "Notre Dame Sem", region: "Upper East" },
    { name: "St. James Sem. & SHS", region: "Bono" },
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
        let bestSchools = schoolsList.filter(s => BEST_27_SCHOOLS.includes(s.name));

        // Fallback or Force: Ensure absolutely all 27 best schools are in the pool bridging from DEFAULT_SCHOOLS
        if (bestSchools.length < 27) {
            const missingNames = BEST_27_SCHOOLS.filter(name => !bestSchools.some(s => s.name === name));
            const missingSchools = missingNames.map(name => {
                const found = DEFAULT_SCHOOLS.find(ds => ds.name === name);
                return found || { name, region: "National" };
            });
            bestSchools = [...bestSchools, ...missingSchools];
        }

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

    // ═══════════════════════════════════════════════════════════════════════
    // AUTHENTIC NSMQ ROUND SIMULATION
    // Each round follows the exact rules of the National Science & Maths Quiz
    // ═══════════════════════════════════════════════════════════════════════
    const finalRounds: RoundScores[] = [];

    // Helper: clamp a value to [min, max]
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    // ── ROUND 1: GENERAL QUESTIONS ──────────────────────────────────────────
    // 10–15 questions rotating across Science, Maths, ICT, Engineering
    // P(correct) = strength × 0.18  |  +3 per correct  |  no penalty
    {
        const numQs = 10 + Math.floor(seededRandom(seed + 2000) * 6); // 10–15
        const r1Scores: [number, number, number] = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            const pCorrect = clamp(strengths[i] * 0.18, 0, 0.95);
            let correct = 0;
            for (let q = 0; q < numQs; q++) {
                if (seededRandom(seed + i * 200 + q + 3000) < pCorrect) correct++;
            }
            r1Scores[i] = correct * 3;
            if (correct === numQs) perfectRound[i] = true;
        }
        // Update cumulative + lead tracking
        r1Scores.forEach((s, i) => cumulativeScores[i] += s);
        const maxC1 = Math.max(...cumulativeScores);
        const leaders1 = cumulativeScores.map((s, i) => s === maxC1 ? i : -1).filter(x => x !== -1);
        if (leaders1.length === 1) currentLeaderIndex = leaders1[0];
        finalRounds.push({ roundName: "General", scores: r1Scores });
    }

    // ── ROUND 2: SPEED RACE (Clue-based) ────────────────────────────────────
    // 5 questions, each with up to 3 clues. Strongest schools buzz earlier.
    // Correct on clue 1→+5, clue 2→+4, clue 3→+3  |  Wrong→−1
    {
        const r2Scores: [number, number, number] = [0, 0, 0];
        for (let q = 0; q < 5; q++) {
            // Buzz priority for this question (higher strength + noise = earlier buzz)
            const buzzOrder = [0, 1, 2]
                .map(i => ({ idx: i, pri: strengths[i] + seededRandom(seed + q * 77 + i + 4000) * 0.5 }))
                .sort((a, b) => b.pri - a.pri);

            const hasAnswered: boolean[] = [false, false, false];
            let resolved = false;

            for (let clue = 1; clue <= 3 && !resolved; clue++) {
                for (const { idx } of buzzOrder) {
                    if (hasAnswered[idx]) continue;
                    // Chance this school buzzes on this clue (stronger schools buzz earlier)
                    const buzzChance = clamp(strengths[idx] * 0.12 * clue + 0.15, 0.05, 0.92);
                    if (seededRandom(seed + q * 111 + idx * 37 + clue * 19 + 5000) < buzzChance) {
                        hasAnswered[idx] = true;
                        // Correct chance increases with later clues (easier hints)
                        // Floor at 0.40 — schools shouldn't buzz unless reasonably confident
                        const pCorrect = clamp(strengths[idx] * 0.22 + clue * 0.10 + 0.18, 0.40, 0.90);
                        if (seededRandom(seed + q * 131 + idx * 41 + clue * 23 + 6000) < pCorrect) {
                            // Correct — award clue-tier points
                            const pts = clue === 1 ? 5 : clue === 2 ? 4 : 3;
                            r2Scores[idx] += pts;
                            resolved = true;
                        } else {
                            // Wrong — penalty
                            r2Scores[idx] -= 1;
                        }
                        break; // Only one school buzzes per clue attempt
                    }
                }
            }
        }
        // Update cumulative + lead tracking
        r2Scores.forEach((s, i) => cumulativeScores[i] += s);
        const maxC2 = Math.max(...cumulativeScores);
        const leaders2 = cumulativeScores.map((s, i) => s === maxC2 ? i : -1).filter(x => x !== -1);
        if (leaders2.length === 1) {
            if (currentLeaderIndex !== -1 && leaders2[0] !== currentLeaderIndex) leadChanges++;
            currentLeaderIndex = leaders2[0];
        } else { currentLeaderIndex = -1; }
        finalRounds.push({ roundName: "Speed Race", scores: r2Scores });
    }

    // ── ROUND 3: PROBLEM OF THE DAY ─────────────────────────────────────────
    // 1 problem broken into 3 sub-parts worth 3 + 3 + 4 = 10 pts each school
    // P(correct sub-part) = strength × 0.25  |  no penalty
    {
        const subPartPts = [3, 3, 4];
        const r3Scores: [number, number, number] = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            const pCorrect = clamp(strengths[i] * 0.25, 0, 0.9);
            for (let part = 0; part < 3; part++) {
                if (seededRandom(seed + i * 150 + part + 7000) < pCorrect) {
                    r3Scores[i] += subPartPts[part];
                }
            }
            if (r3Scores[i] === 10) perfectRound[i] = true;
        }
        r3Scores.forEach((s, i) => cumulativeScores[i] += s);
        const maxC3 = Math.max(...cumulativeScores);
        const leaders3 = cumulativeScores.map((s, i) => s === maxC3 ? i : -1).filter(x => x !== -1);
        if (leaders3.length === 1) {
            if (currentLeaderIndex !== -1 && leaders3[0] !== currentLeaderIndex) leadChanges++;
            currentLeaderIndex = leaders3[0];
        } else { currentLeaderIndex = -1; }
        finalRounds.push({ roundName: "Problem of the Day", scores: r3Scores });
    }

    // ── ROUND 4: TRUE / FALSE ────────────────────────────────────────────────
    // 5–10 rapid-fire statements per school
    // P(correct) = strength × 0.25  |  +3 correct  |  −1 wrong
    {
        const numTFQs = 5 + Math.floor(seededRandom(seed + 8000) * 6); // 5–10
        const r4Scores: [number, number, number] = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            // True/False is a binary question — even random guessing gives ~50% correct
            // Floor at 0.47 ensures weak teams still get roughly half right, preventing
            // extreme negative scores that make Under bets obvious exploits
            const pCorrect = clamp(Math.max(0.47, strengths[i] * 0.30), 0, 0.90);
            let correct = 0, wrong = 0;
            for (let q = 0; q < numTFQs; q++) {
                if (seededRandom(seed + i * 200 + q + 9000) < pCorrect) correct++;
                else wrong++;
            }
            const raw = (correct * 3) - (wrong * 1);
            r4Scores[i] = Math.max(-numTFQs, raw); // Floor at −numQs
            if (r4Scores[i] <= 0) shutoutRound[i] = true;
        }
        r4Scores.forEach((s, i) => cumulativeScores[i] += s);
        const maxC4 = Math.max(...cumulativeScores);
        const leaders4 = cumulativeScores.map((s, i) => s === maxC4 ? i : -1).filter(x => x !== -1);
        if (leaders4.length === 1) {
            if (currentLeaderIndex !== -1 && leaders4[0] !== currentLeaderIndex) leadChanges++;
            currentLeaderIndex = leaders4[0];
        } else { currentLeaderIndex = -1; }
        finalRounds.push({ roundName: "True/False", scores: r4Scores });
    }

    // ── ROUND 5: RIDDLES (Progressive Clues) ────────────────────────────────
    // 5 riddles, each with 2 clues. Buzz order by strength. +3 if correct, no penalty.
    {
        const r5Scores: [number, number, number] = [0, 0, 0];
        for (let r = 0; r < 5; r++) {
            const buzzOrder = [0, 1, 2]
                .map(i => ({ idx: i, pri: strengths[i] + seededRandom(seed + r * 53 + i + 10000) * 0.4 }))
                .sort((a, b) => b.pri - a.pri);

            let ridResolved = false;
            for (let clue = 1; clue <= 2 && !ridResolved; clue++) {
                for (const { idx } of buzzOrder) {
                    const pBuzz = clamp(strengths[idx] * (0.14 + clue * 0.07), 0.05, 0.88);
                    if (seededRandom(seed + r * 61 + idx * 43 + clue * 29 + 11000) < pBuzz) {
                        const pCorrect = clamp(strengths[idx] * (0.20 + clue * 0.10), 0.05, 0.92);
                        if (seededRandom(seed + r * 71 + idx * 47 + clue * 31 + 12000) < pCorrect) {
                            r5Scores[idx] += 3;
                            ridResolved = true;
                        }
                        break; // One school per clue attempt
                    }
                }
            }
        }
        for (let i = 0; i < 3; i++) {
            if (r5Scores[i] === 15) perfectRound[i] = true; // All 5 riddles won
        }
        r5Scores.forEach((s, i) => cumulativeScores[i] += s);
        const maxC5 = Math.max(...cumulativeScores);
        const leaders5 = cumulativeScores.map((s, i) => s === maxC5 ? i : -1).filter(x => x !== -1);
        if (leaders5.length === 1) {
            if (currentLeaderIndex !== -1 && leaders5[0] !== currentLeaderIndex) leadChanges++;
            currentLeaderIndex = leaders5[0];
        } else { currentLeaderIndex = -1; }
        finalRounds.push({ roundName: "Riddles", scores: r5Scores });
    }

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

    // firstBonusIndex = school that scored highest in the Speed Race (Round 2)
    // fastestBuzzIndex = same (strongest school buzzes first on average)
    const r2RoundScores = finalRounds.find(r => r.roundName === "Speed Race")?.scores ?? [0, 0, 0];
    const firstBonusIndex = r2RoundScores.indexOf(Math.max(...r2RoundScores));
    const fastestBuzzIndex = strengths.indexOf(Math.max(...strengths)); // strongest typically buzzes first

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

    // ── TOTAL POINTS: 9 NSMQ-calibrated Over/Under bands ────────────────────
    // Projected total recalibrated for authentic NSMQ scoring ranges:
    //   Weak school (~0.9 str) → ~14 pts | Average (~1.6) → ~43 pts | Strong (~2.4) → ~65 pts
    //   3-team range: ~40 pts (all weak) → ~130+ pts (all strong elite)
    const projectedTotal = outcome.strengths.reduce((a, b) => a + b, 0) * 22;
    const NSMQ_BANDS = [44.5, 54.5, 64.5, 74.5, 84.5, 94.5, 104.5, 114.5, 124.5];
    const totalSpread = 16; // Typical std-dev of match total points
    const totalMargin = 0.165;

    const totalPointsOdds: Record<string, number | null> = {};
    // Step 1: compute raw probabilities and raw odds for qualifying bands
    const activeBands: { band: number; overOdds: number; underOdds: number }[] = [];
    NSMQ_BANDS.forEach(band => {
        const diff = projectedTotal - band;
        const probOver = 1 / (1 + Math.exp(-diff / totalSpread));
        if (probOver >= 0.05 && probOver <= 0.95) {
            activeBands.push({
                band,
                overOdds: getPropOdds(probOver, 0.08, totalMargin, 1.08, 3.50) ?? 1.08,
                underOdds: getPropOdds(1 - probOver, 0.08, totalMargin, 1.08, 3.50) ?? 1.08,
            });
        }
    });
    // Step 2: monotonic correction — Over odds must increase with band, Under odds must decrease
    // This ensures Over 44.5 < Over 54.5 < Over 64.5 (logically: harder to clear a higher bar)
    activeBands.sort((a, b) => a.band - b.band);
    for (let i = 1; i < activeBands.length; i++) {
        // Over: higher band must be >= previous band's Over odds
        activeBands[i].overOdds = Math.max(activeBands[i].overOdds, activeBands[i - 1].overOdds + 0.02);
    }
    for (let i = activeBands.length - 2; i >= 0; i--) {
        // Under: lower band must be >= next band's Under odds (Under 44.5 harder = higher odds)
        activeBands[i].underOdds = Math.max(activeBands[i].underOdds, activeBands[i + 1].underOdds + 0.02);
    }
    // Step 3: cap all odds at 3.50 and round to 2dp
    activeBands.forEach(({ band, overOdds, underOdds }) => {
        totalPointsOdds[`Over ${band}`] = Math.min(3.50, Math.round(overOdds * 100) / 100);
        totalPointsOdds[`Under ${band}`] = Math.min(3.50, Math.round(underOdds * 100) / 100);
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

    // Normalize and clean common suffixes/noise
    const cleanName = name
        .replace(/\s+(SHS|College|School|Academy|Sec Tech|SHST|Girls' SHS)$|'s|'/gi, '')
        .trim();

    const words = cleanName.split(/[\s/-]+/);
    let base = "";

    if (words.length === 1) {
        // Single word: Take first 3 letters if long enough, else the whole word
        base = words[0].length >= 3 ? words[0].substring(0, 3).toUpperCase() : words[0].toUpperCase();
    } else {
        // Multi-word: Take first letters of each significant word
        base = words
            .filter(w => !['the', 'of', 'and', 'for', 'at'].includes(w.toLowerCase()))
            .map(word => word[0]?.toUpperCase())
            .join('');

        // If still 1 char (e.g. only one word significant), take more from that word
        if (base.length === 1 && words[0].length >= 3) {
            base = words[0].substring(0, 3).toUpperCase();
        }
    }

    if (allParticipants.length <= 1) return base;

    // Check for collisions and identical names
    const acronyms: string[] = [];
    allParticipants.forEach((pName, pIdx) => {
        // Repeat clean logic for others to check collisions
        const cName = pName.replace(/\s+(SHS|College|School|Academy|Sec Tech|SHST|Girls' SHS)$|'s|'/gi, '').trim();
        const wds = cName.split(/[\s/-]+/);
        let ac = "";
        if (wds.length === 1) {
            ac = wds[0].length >= 3 ? wds[0].substring(0, 3).toUpperCase() : wds[0].toUpperCase();
        } else {
            ac = wds.filter(w => !['the', 'of', 'and', 'for', 'at'].includes(w.toLowerCase())).map(w => w[0]?.toUpperCase()).join('');
            if (ac.length === 1 && wds[0].length >= 3) ac = wds[0].substring(0, 3).toUpperCase();
        }

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
