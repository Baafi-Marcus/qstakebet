import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Repairs fantasy scoring for ALL lineups against ALL settled NSMQ matches,
// using the canonical settleFantasyPoints logic from lib/fantasy-actions.ts:
//   base = raw score, win bonus = +15, margin bonus = +10 (win by >=10)
// Idempotent via breakdown[matchId]. Also syncs users.total_fantasy_points.

async function run() {
    if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
    const sql = neon(process.env.DATABASE_URL);

    const settledMatches = await sql`
        SELECT id, result FROM matches
        WHERE id LIKE 'nsmq-2026%' AND status = 'settled'
        ORDER BY id
    `;
    const lineups = await sql`SELECT * FROM fantasy_lineups`;

    console.log(`Processing ${lineups.length} lineups x ${settledMatches.length} settled matches\n`);

    let totalAwardedAll = 0;

    for (const lineup of lineups) {
        const breakdown: Record<string, any> = { ...(lineup.points_breakdown || {}) };
        let lineupGain = 0;
        const squad = [lineup.school1_id, lineup.school2_id, lineup.school3_id];

        for (const match of settledMatches) {
            if (breakdown[match.id]) continue; // already scored

            const result = typeof match.result === 'string' ? JSON.parse(match.result) : match.result;
            const scores = result?.scores || {};
            const schoolIds = Object.keys(scores);
            if (schoolIds.length === 0) continue;

            // Derive winner if missing (older settlements stored scores only)
            const winner = result?.winner || Object.entries(scores).sort((a: any, b: any) => b[1] - a[1])[0][0];

            let totalPointsEarnedInMatch = 0;
            const matchBreakdown: Record<string, any> = {};

            for (const schoolId of squad) {
                if (!schoolIds.includes(schoolId)) continue;

                const base = scores[schoolId] || 0;
                let points = base;
                matchBreakdown[schoolId] = { base, bonus: 0 };

                if (schoolId === winner) {
                    points += 15;
                    matchBreakdown[schoolId].bonus += 15;

                    const otherScores = schoolIds
                        .filter(id => id !== winner)
                        .map(id => scores[id] || 0);
                    const margin = base - Math.max(...otherScores, 0);
                    if (margin >= 10) {
                        points += 10;
                        matchBreakdown[schoolId].bonus += 10;
                    }
                }

                matchBreakdown[schoolId].total = points;
                totalPointsEarnedInMatch += points;
            }

            if (totalPointsEarnedInMatch > 0) {
                breakdown[match.id] = matchBreakdown;
                lineupGain += totalPointsEarnedInMatch;
                console.log(`${lineup.id} (${lineup.game_week}) += ${totalPointsEarnedInMatch} from ${match.id}`);
            }
        }

        if (lineupGain !== 0) {
            await sql`
                UPDATE fantasy_lineups
                SET points_earned = points_earned + ${lineupGain},
                    points_breakdown = ${JSON.stringify(breakdown)}::jsonb,
                    updated_at = NOW()
                WHERE id = ${lineup.id}
            `;
            await sql`
                UPDATE users
                SET total_fantasy_points = total_fantasy_points + ${lineupGain}
                WHERE id = ${lineup.user_id}
            `;
            totalAwardedAll += lineupGain;
            console.log(`-> lineup ${lineup.id}: +${lineupGain} pts total\n`);
        }
    }

    console.log(`=== Done. Total awarded across all users: ${totalAwardedAll} ===`);
}

run().catch(console.error).finally(() => process.exit(0));
