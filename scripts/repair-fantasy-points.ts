import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Rebuilds fantasy scoring for ALL lineups against ALL settled NSMQ matches
// using the canonical rules:
//   base = raw score, win bonus = +2, margin bonus = +5 (win by >= 10 vs runner-up)
//
// REBUILD MODE: ignores stored breakdowns and recomputes from match results,
// then adjusts users.total_fantasy_points by the exact delta. Idempotent.

const WIN_BONUS = 2;
const MARGIN_BONUS = 5;

async function run() {
    if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
    const sql = neon(process.env.DATABASE_URL);

    const settledMatches = await sql`
        SELECT id, result FROM matches
        WHERE id LIKE 'nsmq-2026%' AND status = 'settled'
        ORDER BY id
    `;
    const lineups = await sql`SELECT * FROM fantasy_lineups`;

    console.log(`Rebuilding ${lineups.length} lineups x ${settledMatches.length} settled matches (win=+${WIN_BONUS}, margin=+${MARGIN_BONUS})\n`);

    let totalDeltaAll = 0;

    for (const lineup of lineups) {
        const squad = [lineup.school1_id, lineup.school2_id, lineup.school3_id].filter(Boolean);
        const oldBreakdown = lineup.points_breakdown || {};

        // Sum currently stored points (supports both flat {schoolId: n} and nested {matchId: {...}} shapes)
        let oldSum = 0;
        for (const [key, val] of Object.entries(oldBreakdown as Record<string, any>)) {
            if (typeof val === 'number') {
                oldSum += val;
            } else if (val && typeof val === 'object') {
                for (const entry of Object.values(val as Record<string, any>)) {
                    if (entry && typeof entry === 'object' && typeof entry.total === 'number') oldSum += entry.total;
                    else if (typeof entry === 'number') oldSum += entry;
                }
            }
        }

        // Recompute every contest from scratch
        const newBreakdown: Record<string, any> = {};
        let newSum = 0;

        for (const match of settledMatches) {
            const result = typeof match.result === 'string' ? JSON.parse(match.result) : match.result;
            const scores = result?.scores || {};
            const schoolIds = Object.keys(scores);
            if (schoolIds.length === 0) continue;

            const winner = result?.winner || Object.entries(scores).sort((a: any, b: any) => b[1] - a[1])[0][0];

            const matchBreakdown: Record<string, any> = {};
            let earned = 0;

            for (const schoolId of squad) {
                if (!schoolIds.includes(schoolId)) continue;

                const base = scores[schoolId] || 0;
                let points = base;
                matchBreakdown[schoolId] = { base, bonus: 0 };

                if (schoolId === winner) {
                    points += WIN_BONUS;
                    matchBreakdown[schoolId].bonus += WIN_BONUS;

                    const runnerUp = Math.max(...schoolIds.filter(id => id !== winner).map(id => scores[id] || 0), 0);
                    if (base - runnerUp >= 10) {
                        points += MARGIN_BONUS;
                        matchBreakdown[schoolId].bonus += MARGIN_BONUS;
                    }
                }

                matchBreakdown[schoolId].total = points;
                earned += points;
            }

            if (Object.keys(matchBreakdown).length > 0) {
                newBreakdown[match.id] = matchBreakdown;
                newSum += earned;
            }
        }

        const delta = newSum - oldSum;

        await sql`
            UPDATE fantasy_lineups
            SET points_earned = ${newSum},
                points_breakdown = ${JSON.stringify(newBreakdown)}::jsonb,
                updated_at = NOW()
            WHERE id = ${lineup.id}
        `;

        if (delta !== 0) {
            await sql`
                UPDATE users
                SET total_fantasy_points = total_fantasy_points + ${delta}
                WHERE id = ${lineup.user_id}
            `;
            totalDeltaAll += delta;
        }

        console.log(`${lineup.id} (${lineup.game_week}): ${oldSum} -> ${newSum} (delta ${delta >= 0 ? '+' : ''}${delta})`);
    }

    console.log(`\n=== Done. Total user-point adjustment: ${totalDeltaAll >= 0 ? '+' : ''}${totalDeltaAll} ===`);
}

run().catch(console.error).finally(() => process.exit(0));
