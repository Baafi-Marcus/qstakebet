import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const COMMIT = process.argv.includes('--commit');

// ============================================
// DUMMY QUARTER-FINAL DRAW - NSMQ 2026
// Pulls the 27 One-Eighth winners from the DB
// and seeds 9 QF contests of 3 (Aug 30 - Sep 1)
// Stage label matches create-nsmq-tournament.ts.
// Run: npx tsx scripts/import-nsmq-dummy-qf.ts --commit
// ============================================

type Winner = { schoolId: string; name: string; score: number };

async function fetchWinners(): Promise<Winner[]> {
    const rows = await sql`
        SELECT id, result, participants
        FROM matches
        WHERE stage ILIKE '%one-eighth%'
        ORDER BY scheduled_at ASC
    `;

    const winners: Winner[] = [];
    for (const r of rows) {
        const res = r.result as any;
        const parts = (r.participants as any[]) || [];
        const winnerId = res?.winner;
        if (!winnerId) {
            console.error(`  ! ${r.id}: no winner in result`);
            continue;
        }
        const name = parts.find((p: any) => p.schoolId === winnerId)?.name ?? winnerId;
        const score = Number(res?.scores?.[winnerId] ?? 0);
        winners.push({ schoolId: winnerId, name, score });
    }
    return winners;
}

// Deterministic pseudo-shuffle so the dummy draw is stable across runs.
function seededShuffle<T>(arr: T[], seed: number): T[] {
    const a = [...arr];
    let s = seed;
    const rnd = () => {
        s = (s * 1103515245 + 12345) % 2147483648;
        return s / 2147483648;
    };
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function main() {
    console.log(`=== NSMQ 2026 DUMMY QF IMPORT (${COMMIT ? 'COMMIT' : 'DRY RUN'}) ===\n`);

    const winners = await fetchWinners();
    console.log(`One-Eighth winners found: ${winners.length}`);
    if (winners.length < 9) {
        console.error('Need at least 9 winners to build a QF draw.');
        process.exit(1);
    }
    if (winners.length % 3 !== 0) {
        console.warn(`  Note: ${winners.length} winners, will pad the last QF contest with field markers if needed.`);
    }

    const shuffled = seededShuffle(winners, 20260830);
    const contests: Winner[][] = [];
    for (let i = 0; i < shuffled.length; i += 3) {
        contests.push(shuffled.slice(i, i + 3));
    }

    const VENUES = ['MAIN Auditorium', 'SMS Auditorium', 'CNC Auditorium'];
    const DATES = ['2026-08-30', '2026-08-31', '2026-09-01'];
    const DAILY = 3;

    console.log('\n--- DUMMY QF PLAN ---');
    contests.forEach((c, idx) => {
        const day = Math.floor(idx / DAILY);
        const date = `${DATES[day]}T11:00:00.000Z`;
        const venue = VENUES[idx % VENUES.length];
        const matchId = `nsmq-2026-q${idx + 1}`;
        const scores = c.map((w) => `${w.name} (${w.score})`).join(' vs ');
        console.log(`${matchId} ${date.slice(0, 10)} ${venue.padEnd(16)} | ${scores}`);
    });

    if (winners.length % 3 !== 0) {
        console.log('\nWARNING: winners not divisible by 3 — contests built on leftovers.');
    }

    if (!COMMIT) {
        console.log('\nDRY RUN ONLY - rerun with --commit to write matches.');
        return;
    }

    let inserted = 0, updated = 0;
    for (let idx = 0; idx < contests.length; idx++) {
        const matchId = `nsmq-2026-q${idx + 1}`;
        const day = Math.floor(idx / DAILY);
        const date = `${DATES[day]}T11:00:00.000Z`;
        const venue = VENUES[idx % VENUES.length];
        const schools = contests[idx];

        const participants = schools.map((w, j) => ({
            schoolId: w.schoolId,
            name: w.name,
            odd: 1.85,
            category: String.fromCharCode(65 + j), // A, B, C
        }));
        const odds = { 'Match Winner': Object.fromEntries(schools.map((w) => [w.schoolId, 1.85])) };

        const existing = await sql`SELECT id FROM matches WHERE id = ${matchId}`;
        if (existing.length > 0) {
            await sql`
                UPDATE matches
                SET tournament_id = 'nsmq-2026',
                    participants = ${JSON.stringify(participants)},
                    start_time = '11:00 AM',
                    scheduled_at = ${date},
                    status = 'upcoming',
                    stage = 'Quarter-Final Stage',
                    odds = ${JSON.stringify(odds)},
                    sport_type = 'quiz',
                    metadata = ${JSON.stringify({ venue, dummy: true })}
                WHERE id = ${matchId}
            `;
            updated++;
        } else {
            await sql`
                INSERT INTO matches (id, tournament_id, participants, start_time, scheduled_at, status, stage, odds, sport_type, metadata)
                VALUES (
                    ${matchId}, 'nsmq-2026',
                    ${JSON.stringify(participants)},
                    '11:00 AM', ${date}, 'upcoming', 'Quarter-Final Stage',
                    ${JSON.stringify(odds)}, 'quiz', ${JSON.stringify({ venue, dummy: true })}
                )
            `;
            inserted++;
        }
    }

    console.log(`\nDone. inserted=${inserted} updated=${updated}`);
    console.log('QF stage is "Quarter-Final Stage" (matched by isPlayoffStage → quarterFinal).');
}

main().catch((e) => { console.error('ERR:', e.message); process.exit(1); });