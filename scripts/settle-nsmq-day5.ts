import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// ============================================
// DAY 5 RESULTS - NSMQ 2026 Preliminary Stage (Aug 24) - FINAL PRELIMS DAY
// Settles m43-m49. Contest 7 (Presby SHTS, Osino) closed the
// Preliminary Stage; all winners advance to the One-eighth Stage.
// Fantasy points are settled afterwards via repair-fantasy-points.ts.
//
// Notes:
// - m43: Chemu SHTS vs Saviour SHS ended 50-50 after Round 5;
//   Chemu won the tie-breaker (*** in source feed), so winner is set explicitly.
// - m44: Round 2 was never tweeted for this contest.
// ============================================
type Round = { label: string; scores: Record<string, number> };

const day5Results: Array<{
    matchId: string;
    label: string;
    scores: Array<{ schoolName: string; score: number }>;
    rounds?: Array<{ label: string; scores: Array<{ schoolName: string; score: number }> }>;
    winnerName?: string;
}> = [
    {
        matchId: 'nsmq-2026-m43', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'Chemu SHTS', score: 50 },
            { schoolName: 'Saviour SHS', score: 50 },
            { schoolName: 'Wallahs Academy', score: 16 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Saviour SHS', score: 21 }, { schoolName: 'Chemu SHTS', score: 17 }, { schoolName: 'Wallahs Academy', score: 9 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Saviour SHS', score: 33 }, { schoolName: 'Chemu SHTS', score: 24 }, { schoolName: 'Wallahs Academy', score: 8 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Saviour SHS', score: 43 }, { schoolName: 'Chemu SHTS', score: 34 }, { schoolName: 'Wallahs Academy', score: 18 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Chemu SHTS', score: 44 }, { schoolName: 'Saviour SHS', score: 44 }, { schoolName: 'Wallahs Academy', score: 16 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Chemu SHTS', score: 50 }, { schoolName: 'Saviour SHS', score: 50 }, { schoolName: 'Wallahs Academy', score: 16 }] },
        ],
        winnerName: 'Chemu SHTS',
    },
    {
        matchId: 'nsmq-2026-m44', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Tepa SHS', score: 49 },
            { schoolName: 'Suhum SHTS', score: 39 },
            { schoolName: 'Adu Gyamfi SHS', score: 17 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Tepa SHS', score: 18 }, { schoolName: 'Suhum SHTS', score: 16 }, { schoolName: 'Adu Gyamfi SHS', score: 11 }] },
            // Round 2 was never tweeted for this contest; jumping to Round 3
            { label: 'Round 3', scores: [{ schoolName: 'Tepa SHS', score: 36 }, { schoolName: 'Suhum SHTS', score: 26 }, { schoolName: 'Adu Gyamfi SHS', score: 13 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Tepa SHS', score: 49 }, { schoolName: 'Suhum SHTS', score: 33 }, { schoolName: 'Adu Gyamfi SHS', score: 11 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Tepa SHS', score: 49 }, { schoolName: 'Suhum SHTS', score: 39 }, { schoolName: 'Adu Gyamfi SHS', score: 17 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m45', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Sonrise Christian High School', score: 51 },
            { schoolName: 'Nyakrom SHTS', score: 29 },
            { schoolName: "St. Mary's Boys' SHS", score: 28 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: "St. Mary's Boys' SHS", score: 16 }, { schoolName: 'Sonrise Christian High School', score: 16 }, { schoolName: 'Nyakrom SHTS', score: 15 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Sonrise Christian High School', score: 33 }, { schoolName: "St. Mary's Boys' SHS", score: 18 }, { schoolName: 'Nyakrom SHTS', score: 13 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Sonrise Christian High School', score: 38 }, { schoolName: "St. Mary's Boys' SHS", score: 21 }, { schoolName: 'Nyakrom SHTS', score: 16 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Sonrise Christian High School', score: 48 }, { schoolName: "St. Mary's Boys' SHS", score: 25 }, { schoolName: 'Nyakrom SHTS', score: 23 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Sonrise Christian High School', score: 51 }, { schoolName: 'Nyakrom SHTS', score: 29 }, { schoolName: "St. Mary's Boys' SHS", score: 28 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m46', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'Sogakope SHS', score: 56 },
            { schoolName: 'Apam SHS', score: 37 },
            { schoolName: 'Okomfo Anokye SHS', score: 27 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Apam SHS', score: 18 }, { schoolName: 'Sogakope SHS', score: 18 }, { schoolName: 'Okomfo Anokye SHS', score: 15 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Sogakope SHS', score: 32 }, { schoolName: 'Apam SHS', score: 22 }, { schoolName: 'Okomfo Anokye SHS', score: 18 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Sogakope SHS', score: 37 }, { schoolName: 'Apam SHS', score: 24 }, { schoolName: 'Okomfo Anokye SHS', score: 17 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Sogakope SHS', score: 50 }, { schoolName: 'Apam SHS', score: 31 }, { schoolName: 'Okomfo Anokye SHS', score: 27 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Sogakope SHS', score: 56 }, { schoolName: 'Apam SHS', score: 37 }, { schoolName: 'Okomfo Anokye SHS', score: 27 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m47', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Afua Kobi Ampem SHS', score: 50 },
            { schoolName: 'Nifa SHS', score: 35 },
            { schoolName: 'Kanton SHS', score: 20 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Afua Kobi Ampem SHS', score: 23 }, { schoolName: 'Nifa SHS', score: 14 }, { schoolName: 'Kanton SHS', score: 6 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Afua Kobi Ampem SHS', score: 31 }, { schoolName: 'Nifa SHS', score: 19 }, { schoolName: 'Kanton SHS', score: 5 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Afua Kobi Ampem SHS', score: 34 }, { schoolName: 'Nifa SHS', score: 22 }, { schoolName: 'Kanton SHS', score: 7 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Afua Kobi Ampem SHS', score: 41 }, { schoolName: 'Nifa SHS', score: 35 }, { schoolName: 'Kanton SHS', score: 20 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Afua Kobi Ampem SHS', score: 50 }, { schoolName: 'Nifa SHS', score: 35 }, { schoolName: 'Kanton SHS', score: 20 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m48', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Islamic SHS, Kumasi', score: 45 },
            { schoolName: 'Tamale Islamic Science SHS', score: 40 },
            { schoolName: 'Armed Forces SHTS', score: 30 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Islamic SHS, Kumasi', score: 20 }, { schoolName: 'Tamale Islamic Science SHS', score: 19 }, { schoolName: 'Armed Forces SHTS', score: 12 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Islamic SHS, Kumasi', score: 26 }, { schoolName: 'Tamale Islamic Science SHS', score: 23 }, { schoolName: 'Armed Forces SHTS', score: 14 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Islamic SHS, Kumasi', score: 29 }, { schoolName: 'Tamale Islamic Science SHS', score: 24 }, { schoolName: 'Armed Forces SHTS', score: 14 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Tamale Islamic Science SHS', score: 40 }, { schoolName: 'Islamic SHS, Kumasi', score: 39 }, { schoolName: 'Armed Forces SHTS', score: 27 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Islamic SHS, Kumasi', score: 45 }, { schoolName: 'Tamale Islamic Science SHS', score: 40 }, { schoolName: 'Armed Forces SHTS', score: 30 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m49', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Presby SHTS, Osino', score: 51 },
            { schoolName: 'Aggrey Memorial SHS', score: 46 },
            { schoolName: 'Nkonya SHS', score: 3 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Aggrey Memorial SHS', score: 20 }, { schoolName: 'Presby SHTS, Osino', score: 19 }, { schoolName: 'Nkonya SHS', score: 0 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Aggrey Memorial SHS', score: 26 }, { schoolName: 'Presby SHTS, Osino', score: 23 }, { schoolName: 'Nkonya SHS', score: 0 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Aggrey Memorial SHS', score: 34 }, { schoolName: 'Presby SHTS, Osino', score: 29 }, { schoolName: 'Nkonya SHS', score: 1 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Presby SHTS, Osino', score: 45 }, { schoolName: 'Aggrey Memorial SHS', score: 43 }, { schoolName: 'Nkonya SHS', score: 3 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Presby SHTS, Osino', score: 51 }, { schoolName: 'Aggrey Memorial SHS', score: 46 }, { schoolName: 'Nkonya SHS', score: 3 }] },
        ],
    },
];

// Tweet names -> DB participant names where fuzzy matching falls short
const ALIASES: Record<string, string> = {
    'Aggrey Memorial SHS': "Aggrey Mem. Zion SHS",
    "St. Mary's Boys' SHS": "St. Mary's Boys', Apowa",
    'Afua Kobi Ampem SHS': "Afua Kobi Ampem Girls'",
    'Sonrise Christian High School': 'Sonrise Christian High',
};

function resolveAlias(name: string): string {
    return ALIASES[name] ?? name;
}

// ---- Name normalization & fuzzy matching (token-prefix aware) ----
function norm(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function nameMatches(a: string, b: string): boolean {
    const na = norm(a);
    const nb = norm(b);
    if (na === nb) return true;
    if (na.includes(nb) || nb.includes(na)) return true;
    const ta = na.split(' ');
    const tb = nb.split(' ');
    if (ta.length !== tb.length) return false;
    return ta.every((tok, i) => tok === tb[i] || tok.startsWith(tb[i]) || tb[i].startsWith(tok));
}

async function run() {
    console.log('=== SETTLING NSMQ 2026 DAY 5 (FINAL PRELIMS DAY) ===');
    if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
    const sql = neon(process.env.DATABASE_URL);

    let settledCount = 0;
    const failures: string[] = [];

    for (const entry of day5Results) {
        const rows = await sql`SELECT id, participants, result, status, sport_type, gender FROM matches WHERE id = ${entry.matchId}`;
        if (rows.length === 0) {
            failures.push(`${entry.matchId}: match not found`);
            continue;
        }
        const match = rows[0];
        if (match.status === 'settled') {
            console.log(`SKIP ${entry.matchId} (already settled)`);
            continue;
        }

        const parts: any[] = typeof match.participants === 'string'
            ? JSON.parse(match.participants)
            : match.participants;

        // Map pasted school names -> participant schoolIds
        const customScores: Record<string, number> = {};
        const unmapped: string[] = [];
        for (const s of entry.scores) {
            const target = resolveAlias(s.schoolName);
            const participant = parts.find(
                (p) => nameMatches(p.name, target) || nameMatches(target, p.name)
            );
            if (participant) {
                customScores[participant.schoolId] = s.score;
            } else {
                unmapped.push(s.schoolName);
            }
        }

        if (Object.keys(customScores).length !== parts.length || unmapped.length > 0) {
            failures.push(`${entry.matchId}: could not map [${unmapped.join(', ')}] to participants [${parts.map((p) => p.name).join(' | ')}]`);
            continue;
        }

        // Winner: explicit override (tie-breakers) or highest scorer
        let winner: string;
        if (entry.winnerName) {
            const target = resolveAlias(entry.winnerName);
            const wp = parts.find((p) => nameMatches(p.name, target) || nameMatches(target, p.name));
            if (!wp) {
                failures.push(`${entry.matchId}: winnerName '${entry.winnerName}' not found among participants`);
                continue;
            }
            winner = wp.schoolId;
        } else {
            winner = Object.entries(customScores).sort((a, b) => b[1] - a[1])[0][0];
        }

        // Round-by-round keyed by schoolId (when provided)
        let rounds: Round[] | undefined;
        if (entry.rounds?.length) {
            rounds = entry.rounds.map(rd => {
                const rs: Record<string, number> = {};
                for (const s of rd.scores) {
                    const target = resolveAlias(s.schoolName);
                    const p = parts.find(x => nameMatches(x.name, target) || nameMatches(target, x.name));
                    if (p) rs[p.schoolId] = s.score;
                }
                return { label: rd.label, scores: rs };
            });
        }

        // 1. Map flat scores back into each participant's 'result' field
        const updatedParticipants = parts.map((p) => ({
            ...p,
            result: customScores[p.schoolId] ?? p.result ?? null,
        }));

        const previousResult = typeof match.result === 'string' ? JSON.parse(match.result || '{}') : (match.result || {});

        // 2. Record history (mirrors recordMatchUpdate)
        await sql`
            INSERT INTO match_history (id, match_id, action, previous_data, new_data, updated_by, metadata, created_at)
            VALUES (
                ${`mh-${Date.now()}-${Math.random().toString(36).substring(7)}`},
                ${entry.matchId}, 'status_change',
                ${JSON.stringify({ scores: previousResult?.scores ?? null, status: match.status })}::jsonb,
                ${JSON.stringify({ scores: customScores, status: 'settled', winner })}::jsonb,
                'system', ${JSON.stringify({ source: 'day5-manual-settlement', auditorium: entry.label })}::jsonb,
                NOW()
            )
        `;

        // 3. Update the match itself (consistent with Days 1-4: status='settled')
        await sql`
            UPDATE matches
            SET participants = ${JSON.stringify(updatedParticipants)}::jsonb,
                result = ${JSON.stringify({ ...previousResult, scores: customScores, winner, rounds: rounds || [] })}::jsonb,
                status = 'settled',
                last_tick_at = NOW()
            WHERE id = ${entry.matchId}
        `;

        // 4. Update realSchoolStats (mirrors updateRealSchoolStats)
        const sport = match.sport_type || 'quiz';
        const gender = match.gender || 'male';
        for (const p of parts) {
            const schoolId = p.schoolId;
            const existing = await sql`
                SELECT * FROM real_school_stats
                WHERE school_id = ${schoolId} AND sport_type = ${sport} AND gender = ${gender}
                LIMIT 1
            `;
            let stats = existing[0];
            if (!stats) {
                const inserted = await sql`
                    INSERT INTO real_school_stats (id, school_id, sport_type, gender)
                    VALUES (${`rss-${Date.now()}-${Math.random().toString(36).substring(7)}`}, ${schoolId}, ${sport}, ${gender})
                    RETURNING *
                `;
                stats = inserted[0];
            }

            const isWin = winner === schoolId;
            const others = parts.filter((x) => x.schoolId !== schoolId);
            const goalsFor = customScores[schoolId] || 0;
            const goalsAgainst = others.length > 0
                ? Math.round(others.reduce((acc, x) => acc + (customScores[x.schoolId] || 0), 0) / others.length)
                : 0;

            const formChange = isWin ? 0.05 : -0.05;

            await sql`
                UPDATE real_school_stats
                SET matches_played = ${(stats.matches_played || 0) + 1},
                    wins = ${(stats.wins || 0) + (isWin ? 1 : 0)},
                    losses = ${(stats.losses || 0) + (!isWin ? 1 : 0)},
                    draws = ${(stats.draws || 0)},
                    goals_for = ${(stats.goals_for || 0) + goalsFor},
                    goals_against = ${(stats.goals_against || 0) + goalsAgainst},
                    points = ${(stats.points || 0) + (isWin ? 3 : 0)},
                    current_form = ${Math.max(0.2, (stats.current_form || 1.0) + formChange)},
                    last_updated = NOW()
                WHERE id = ${stats.id}
            `;
        }

        settledCount++;
        console.log(`OK   ${entry.matchId} (${entry.label}) -> winner=${parts.find((p) => p.schoolId === winner)?.name}${entry.winnerName ? ' [tie-break]' : ''} | scores: ${Object.values(customScores).join('/')} | rounds: ${rounds?.length ?? 0}`);
    }

    console.log('\n====================================');
    console.log(`Settled: ${settledCount}/${day5Results.length}`);
    if (failures.length > 0) {
        console.log('FAILURES:');
        failures.forEach((f) => console.log('  - ' + f));
        process.exit(1);
    }
}

run().catch(console.error).finally(() => process.exit(0));
