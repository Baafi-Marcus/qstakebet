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
// REAL QUARTER-FINAL DRAW - NSMQ 2026
// Each contest keeps its real broadcast date.
// Team names are the exact DB names of the 27
// One-Eighth winners (no fuzzy matching).
// Run: npx tsx scripts/import-nsmq-real-qf.ts --commit
// ============================================

const CONTESTS: { id: string; qf: number; date: string; teams: string[] }[] = [
    // Sunday, August 30, 2026 (QF 1-3)
    { id: 'nsmq-2026-q1', qf: 1, date: '2026-08-30', teams: ['Prempeh College', 'Keta SHS', 'Ghana National College'] },
    { id: 'nsmq-2026-q2', qf: 2, date: '2026-08-30', teams: ['Osei Tutu SHS', 'Ofori Panin SHS', 'Pope John Minor Seminary & SHS'] },
    { id: 'nsmq-2026-q3', qf: 3, date: '2026-08-30', teams: ["St. John's Grammar SHS", "Aburi Girls' SHS", "St. Augustine's College"] },
    // Monday, August 31, 2026 (QF 4-6)
    { id: 'nsmq-2026-q4', qf: 4, date: '2026-08-31', teams: ['Labone SHS', 'St. Hubert Sem. SHS', 'Tamale SHS'] },
    { id: 'nsmq-2026-q5', qf: 5, date: '2026-08-31', teams: ["Mfantsiman Girls' SHS", "St. John's School", 'Saviour SHS'] },
    { id: 'nsmq-2026-q6', qf: 6, date: '2026-08-31', teams: ['PRESEC, Legon', 'Presby SHS, Bompata', 'Mfantsipim School'] },
    // Tuesday, September 1, 2026 (QF 7-9)
    { id: 'nsmq-2026-q7', qf: 7, date: '2026-09-01', teams: ['Amaniampong SHS', 'Chemu SHTS', 'Bright SHS'] },
    { id: 'nsmq-2026-q8', qf: 8, date: '2026-09-01', teams: ['Achimota School', 'Boa Amponsem SHS', 'Adisadel College'] },
    { id: 'nsmq-2026-q9', qf: 9, date: '2026-09-01', teams: ['Accra Academy', 'University Practice SHS', 'Bishop Herman College'] },
];

const VENUES = ['MAIN Auditorium', 'SMS Auditorium', 'CNC Auditorium'];

function norm(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
    console.log(`=== NSMQ 2026 REAL QF IMPORT (${COMMIT ? 'COMMIT' : 'DRY RUN'}) ===\n`);

    // 1. Pull the 27 One-Eighth winners with stable identity (participants + winner).
    const oneEighth = await sql`
        SELECT result, participants
        FROM matches
        WHERE stage ILIKE '%one-eighth%'
    `;

    const winners: { schoolId: string; name: string }[] = [];
    for (const r of oneEighth) {
        const res = r.result as any;
        const parts = (r.participants as any[]) || [];
        const winnerId = res?.winner;
        if (!winnerId) continue;
        const name = parts.find((p: any) => p.schoolId === winnerId)?.name ?? winnerId;
        winners.push({ schoolId: winnerId, name });
    }
    console.log(`One-Eighth winners found: ${winners.length}`);
    if (winners.length !== 27) {
        console.error(`Expected 27 winners, got ${winners.length}. Aborting.`);
        process.exit(1);
    }

    // 2. Build lookup by normalized DB name.
    const byName = new Map<string, { schoolId: string; name: string }>();
    for (const w of winners) {
        if (!byName.has(norm(w.name))) byName.set(norm(w.name), w);
    }

    // 3. Resolve every contest and print the plan.
    const resolved = CONTESTS.map(c => {
        const spots = c.teams.map(team => {
            const key = norm(team);
            const hit = byName.get(key);
            if (hit) return hit;
            // Accept a unique prefix match (e.g. shortened pasted names)
            const candidates = Array.from(byName.keys()).filter(k => k.startsWith(key) || key.startsWith(k));
            return candidates.length === 1 ? byName.get(candidates[0])! : null;
        });
        return { ...c, spots };
    });

    let allResolved = true;
    resolved.forEach(c => {
        const names = c.spots.map(s => s?.name ?? `UNMATCHED(${c.teams[c.spots.indexOf(null)] || ''})`);
        const bad = c.spots.some(s => !s);
        if (bad) allResolved = false;
        console.log(`${c.id} ${c.date} QF-${c.qf} | ${names.join(' vs ')}${bad ? '  <<< MATCH FAILED' : ''}`);
    });

    if (!allResolved) {
        console.error('\nOne or more teams could not be matched to a One-Eighth winner. Fix the plan and rerun.');
        process.exit(1);
    }

    if (!COMMIT) {
        console.log('\nDRY RUN ONLY - rerun with --commit to write matches.');
        return;
    }

    // 4. Upsert matches. The real QF number is stored in metadata so the label survives date ordering.
    let inserted = 0, updated = 0;
    for (const c of resolved) {
        const matchId = c.id;
        const date = `${c.date}T11:00:00.000Z`;
        const venue = VENUES[(c.qf - 1) % VENUES.length];

        const participants = c.spots.map((s, j) => ({
            schoolId: s!.schoolId,
            name: s!.name,
            odd: 1.85,
            category: String.fromCharCode(65 + j),
        }));
        const odds = { 'Match Winner': Object.fromEntries(c.spots.map(s => [s!.schoolId, 1.85])) };

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
                    metadata = ${JSON.stringify({ venue, qfLabel: c.qf })}
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
                    ${JSON.stringify(odds)}, 'quiz', ${JSON.stringify({ venue, qfLabel: c.qf })}
                )
            `;
            inserted++;
        }
    }

    console.log(`\nDone. inserted=${inserted} updated=${updated}`);
    console.log('QF stages are "Quarter-Final Stage" (matched by isPlayoffStage → quarterFinal).');
}

main().catch((e) => { console.error('ERR:', e.message); process.exit(1); });