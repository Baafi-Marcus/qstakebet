import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Shift One-Eighth Stage fixtures (m50-m76) back one day:
//   Aug 27 -> Aug 26, Aug 28 -> Aug 27, Aug 29 -> Aug 28
// Keeps 9 contests per day and preserves kickoff times + venue rotation.
// Also remaps any drafted fantasy_lineups to the new gameWeek labels.

const SHIFT_DAYS = -1;

async function run() {
    if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
    const sql = neon(process.env.DATABASE_URL);

    const fixtures = await sql`
        SELECT id, scheduled_at, status
        FROM matches
        WHERE stage = 'One-Eighth Stage'
        ORDER BY scheduled_at, id
    `;
    console.log(`One-eighth fixtures found: ${fixtures.length}`);

    const byDay = new Map<string, number>();
    for (const f of fixtures) {
        const d = new Date(f.scheduled_at).toISOString().slice(0, 10);
        byDay.set(d, (byDay.get(d) || 0) + 1);
    }
    console.log('Current distribution:', Object.fromEntries(byDay));

    const lineupGws = await sql`
        SELECT game_week, COUNT(*)::int AS cnt
        FROM fantasy_lineups
        WHERE game_week LIKE 'Matchday 2026-08-2%'
        GROUP BY game_week ORDER BY game_week
    `;
    console.log('Existing lineups per game week:', lineupGws);

    if (!process.argv.includes('--commit')) {
        console.log('\nDRY RUN - no changes made. Re-run with --commit.');
        return;
    }

    // Shift matches (single UPDATE using date arithmetic)
    await sql`
        UPDATE matches
        SET scheduled_at = scheduled_at + (${SHIFT_DAYS} || ' days')::interval
        WHERE stage = 'One-Eighth Stage'
          AND status NOT IN ('finished', 'settled')
    `;

    // Remap lineups newest-first to avoid label collisions
    await sql`UPDATE fantasy_lineups SET game_week = 'Matchday 2026-08-28' WHERE game_week = 'Matchday 2026-08-29'`;
    await sql`UPDATE fantasy_lineups SET game_week = 'Matchday 2026-08-27' WHERE game_week = 'Matchday 2026-08-28'`;
    await sql`UPDATE fantasy_lineups SET game_week = 'Matchday 2026-08-26' WHERE game_week = 'Matchday 2026-08-27'`;

    const after = await sql`
        SELECT DATE(scheduled_at) AS d, COUNT(*)::int AS cnt
        FROM matches
        WHERE id LIKE 'nsmq-2026-m%' AND CAST(id AS text) >= 'nsmq-2026-m50'
        GROUP BY DATE(scheduled_at) ORDER BY d
    `;
    console.log('\nNew distribution:', after);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
