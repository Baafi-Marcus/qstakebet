import { db } from "./db";
import { matches, bets } from "./db/schema";
import { eq, and, sql } from "drizzle-orm";
import { simulateMatch, VirtualMatchOutcome } from "./virtuals";
import { settleMatch } from "./settlement";

/**
 * Initializes a scheduled match for global live progression.
 * Pre-simulates the outcome and stores it in liveMetadata.
 */
export async function initializeLiveMatch(matchId: string) {
    const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!matchData.length) return;

    const match = matchData[0];

    // Check if already initialized or live
    if (match.liveMetadata) return;

    // Convert participants to required format for simulation if needed
    // or use school IDs/names to get strengths
    const participants = match.participants as any[];
    const schoolNames = participants.map(p => p.name);

    // Simulate the full match beforehand
    // We use a fixed seed for this match to ensure consistency
    const matchSeed = parseInt(match.id.replace(/[^0-9]/g, '').slice(-6)) || Date.now();

    // Assuming simulateMatch exists in virtuals.ts
    // We might need to adapt it for specifically 3 schools or 2? 
    // Quiz usually has 3 schools.
    const outcome = simulateMatch(
        0, // roundId (used for seeding in virtuals)
        matchSeed % 100, // index
        undefined, // default schools list
        'national', // category
        undefined, // region
        {}, // strengths
        matchSeed
    );

    await db.update(matches).set({
        liveMetadata: outcome,
        status: 'live',
        isLive: true,
        currentRound: 0,
        lastTickAt: new Date()
    }).where(eq(matches.id, matchId));

    console.log(`Match ${matchId} initialized for live play.`);
}

/**
 * Tick function to advance all active live matches.
 * Should be called periodically (e.g. every 30s-1m).
 */
export async function processMatchTicks() {
    const liveMatches = await db.select().from(matches)
        .where(and(eq(matches.status, 'live'), eq(matches.isVirtual, false)));

    const TICK_INTERVAL_MS = 60 * 1000; // 1 minute per round for Live Matches
    const now = new Date();

    for (const match of liveMatches) {
        if (!match.liveMetadata || !match.lastTickAt) continue;

        const lastTick = new Date(match.lastTickAt);
        if (now.getTime() - lastTick.getTime() < TICK_INTERVAL_MS) continue;

        // Advance to next round
        const outcome = match.liveMetadata as unknown as VirtualMatchOutcome;
        const totalRounds = outcome.rounds.length;
        const nextRound = match.currentRound + 1;

        if (nextRound >= totalRounds) {
            // Match Finished
            await db.update(matches).set({
                status: 'finished',
                isLive: false,
                currentRound: nextRound,
                result: outcome, // Persist final outcome as result
                lastTickAt: now
            }).where(eq(matches.id, match.id));

            console.log(`Match ${match.id} finished. Triggering settlement...`);
            await settleMatch(match.id);
        } else {
            // Just update round and result (partial result)
            // Create a truncated result for current round
            const partialResult = {
                ...outcome,
                rounds: outcome.rounds.slice(0, nextRound + 1),
                totalScores: [0, 0, 0] // Reset to re-sum
            };

            // Re-calculate scores for rounds played so far
            partialResult.rounds.forEach(r => {
                partialResult.totalScores[0] += r.scores[0];
                partialResult.totalScores[1] += r.scores[1];
                partialResult.totalScores[2] += r.scores[2];
            });

            await db.update(matches).set({
                currentRound: nextRound,
                result: partialResult,
                // Dynamic Odds Update
                odds: recalculateLiveOdds(match.odds as Record<string, number>, partialResult.totalScores, nextRound, totalRounds),
                lastTickAt: now
            }).where(eq(matches.id, match.id));

            console.log(`Match ${match.id} advanced to round ${nextRound}. Odds updated.`);
        }
    }
}

/**
 * Recalculates odds based on current score gap and remaining rounds.
 */
function recalculateLiveOdds(
    currentOdds: Record<string, number>,
    scores: number[],
    currentRound: number,
    totalRounds: number
): Record<string, number> {
    const newOdds: Record<string, number> = { ...currentOdds };
    const participants = Object.keys(currentOdds).filter(k => k !== 'X');

    if (participants.length < 2) return currentOdds;

    const remainingRounds = totalRounds - (currentRound + 1);
    const progressFactor = (currentRound + 1) / totalRounds;

    // Calculate win probabilities based on point gap
    const totalPoints = scores.reduce((a, b) => a + b, 0) || 1;
    const avgPointsPerRound = totalPoints / (currentRound + 1);
    const expectedRemainingPoints = avgPointsPerRound * remainingRounds;

    // Shift probability based on current lead
    const rawProbs = scores.map((s, i) => {
        const lead = s - (Math.max(...scores.filter((_, idx) => idx !== i)));
        // Sigmoid-like adjustment: lead of 15% of total points shifts prob significantly
        const shift = Math.tanh(lead / 10) * progressFactor;
        const baseProb = 1 / (currentOdds[participants[i]] || 3);
        return Math.max(0.05, Math.min(0.95, baseProb + shift));
    });

    // Normalize probabilities
    const sumProbs = rawProbs.reduce((a, b) => a + b, 0);
    const finalProbs = rawProbs.map(p => p / sumProbs);

    // Convert back to odds with a small margin (5%)
    participants.forEach((pId, i) => {
        const decimalOdds = 1 / finalProbs[i];
        newOdds[pId] = Math.round(Math.max(1.01, decimalOdds * 0.95) * 100) / 100;
    });

    // Adjust Draw (X) if applicable
    if (newOdds['X']) {
        const scoreDiff = Math.abs(scores[0] - scores[1]);
        if (scoreDiff > 10) newOdds['X'] = Math.min(50, newOdds['X'] * 1.5);
        else if (scoreDiff < 5) newOdds['X'] = Math.max(2, newOdds['X'] * 0.8);
    }

    return newOdds;
}
