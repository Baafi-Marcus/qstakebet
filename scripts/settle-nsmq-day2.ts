import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// ============================================
// DAY 2 RESULTS - NSMQ 2026 Preliminary Stage
// Final "End of Contest" scores only
// ============================================
const day2Results: Array<{
    matchId: string;
    label: string;
    scores: Array<{ schoolName: string; score: number }>;
}> = [
    {
        matchId: 'nsmq-2026-m10', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'Tema Secondary School', score: 42 },
            { schoolName: "St. Paul's SHS, Denu", score: 31 },
            { schoolName: 'Tarkwa SHS', score: 29 },
        ],
    },
    {
        matchId: 'nsmq-2026-m11', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Ghanata SHS', score: 51 },
            { schoolName: "O'Reilly SHS", score: 43 },
            { schoolName: 'Yendi SHS', score: 22 },
        ],
    },
    {
        matchId: 'nsmq-2026-m12', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'St. Joseph Seminary SHS', score: 52 },
            { schoolName: 'KNUST SHS', score: 39 },
            { schoolName: 'SDA SHS, Agona', score: 28 },
        ],
    },
    {
        matchId: 'nsmq-2026-m13', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'St. Francis Xavier Jnr. Sem.', score: 56 },
            { schoolName: 'Pentecost SHS', score: 25 },
            { schoolName: 'Nana Brentu SHS', score: 13 },
        ],
    },
    {
        matchId: 'nsmq-2026-m14', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Ofori Panin SHS', score: 53 },
            { schoolName: 'Mim SHS', score: 42 },
            { schoolName: 'Oyoko Methodist SHS', score: 36 },
        ],
    },
    {
        matchId: 'nsmq-2026-m15', label: 'CNC Auditorium',
        scores: [
            { schoolName: "Kumasi Girls' SHS", score: 43 },
            { schoolName: 'Osei Kyeretwie SHS', score: 32 },
            { schoolName: "Tamale Girls' SHS", score: 23 },
        ],
    },
    {
        matchId: 'nsmq-2026-m16', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'Tamale SHS', score: 68 },
            { schoolName: 'Kalpohin SHS', score: 41 },
            { schoolName: 'Wenchi Methodist SHS', score: 30 },
        ],
    },
    {
        matchId: 'nsmq-2026-m17', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Kadjebi Asato SHS', score: 56 },
            { schoolName: "Ahantaman Girls' SHS", score: 48 },
            { schoolName: 'Ada SHTS', score: 35 },
        ],
    },
    {
        matchId: 'nsmq-2026-m18', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Anglican SHS, Kumasi', score: 69 },
            { schoolName: 'Namong SHTS', score: 28 },
            { schoolName: 'Shama SHS', score: 25 },
        ],
    },
    {
        matchId: 'nsmq-2026-m19', label: 'MAIN Auditorium',
        scores: [
            { schoolName: "Wesley Girls' High School", score: 59 },
            { schoolName: 'Nkwatia Presby SHS', score: 26 },
            { schoolName: 'Simms SHS', score: 22 },
        ],
    },
    {
        matchId: 'nsmq-2026-m20', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Labone SHS', score: 41 },
            { schoolName: 'Notre Dame Seminary SHS', score: 39 },
            { schoolName: 'T. I. Amass, Wa', score: 3 },
        ],
    },
    {
        matchId: 'nsmq-2026-m21', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Winneba Secondary School', score: 44 },
            { schoolName: 'Fijai SHS', score: 42 },
            { schoolName: 'Enyan Denkyira SHTS', score: 12 },
        ],
    },
];

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
    console.log('=== SETTLING NSMQ 2026 DAY 2 (m10 - m21) ===');
    if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
    const sql = neon(process.env.DATABASE_URL);

    let settledCount = 0;
    const failures: string[] = [];

    for (const entry of day2Results) {
        const rows = await sql`SELECT id, participants, result, status, sport_type, gender FROM matches WHERE id = ${entry.matchId}`;
        if (rows.length === 0) {
            failures.push(`${entry.matchId}: match not found`);
            continue;
        }
        const match = rows[0];
        if (match.status !== 'upcoming') {
            console.log(`SKIP ${entry.matchId} (status=${match.status})`);
            continue;
        }

        const parts: any[] = typeof match.participants === 'string'
            ? JSON.parse(match.participants)
            : match.participants;

        // Map pasted school names -> participant schoolIds
        const customScores: Record<string, number> = {};
        const unmapped: string[] = [];
        for (const s of entry.scores) {
            const participant = parts.find(
                (p) => nameMatches(p.name, s.schoolName) || nameMatches(s.schoolName, p.name)
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

        // Winner = highest scorer
        const winner = Object.entries(customScores).sort((a, b) => b[1] - a[1])[0][0];

        // 1. Map flat scores back into each participant's 'result' field
        const updatedParticipants = parts.map((p) => ({
            ...p,
            result: customScores[p.schoolId] ?? p.result ?? null,
        }));

        // 2. Record history (mirrors recordMatchUpdate)
        await sql`
            INSERT INTO match_history (id, match_id, action, previous_data, new_data, updated_by, metadata, created_at)
            VALUES (
                ${`mh-${Date.now()}-${Math.random().toString(36).substring(7)}`},
                ${entry.matchId}, 'status_change',
                ${JSON.stringify({ scores: match.result?.scores ?? null, status: match.status })}::jsonb,
                ${JSON.stringify({ scores: customScores, status: 'settled', winner })}::jsonb,
                'system', ${JSON.stringify({ source: 'day2-manual-settlement', auditorium: entry.label })}::jsonb,
                NOW()
            )
        `;

        // 3. Update the match itself (consistent with Day 1: status='settled')
        await sql`
            UPDATE matches
            SET participants = ${JSON.stringify(updatedParticipants)}::jsonb,
                result = ${JSON.stringify({ scores: customScores, winner })}::jsonb,
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

        // 5. Settle fantasy lineups for this game week (mirrors settleFantasyLineups overwrite-by-school semantics)
        const lineups = await sql`SELECT * FROM fantasy_lineups WHERE game_week = 'Preliminary Stage'`;
        for (const lineup of lineups) {
            const breakdown: Record<string, number> = { ...(lineup.points_breakdown || {}) };
            let changed = false;
            for (const sid of [lineup.school1_id, lineup.school2_id, lineup.school3_id]) {
                if (customScores[sid] !== undefined) {
                    breakdown[sid] = customScores[sid];
                    changed = true;
                }
            }
            if (changed) {
                const newTotal = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
                const difference = newTotal - (lineup.points_earned || 0);
                await sql`
                    UPDATE fantasy_lineups
                    SET points_breakdown = ${JSON.stringify(breakdown)}::jsonb,
                        points_earned = ${newTotal},
                        status = 'settled',
                        updated_at = NOW()
                    WHERE id = ${lineup.id}
                `;
                if (difference !== 0) {
                    await sql`
                        UPDATE users
                        SET lifetime_points = lifetime_points + ${difference}
                        WHERE id = ${lineup.user_id}
                    `;
                }
            }
        }

        settledCount++;
        console.log(`OK   ${entry.matchId} (${entry.label}) -> winner=${parts.find((p) => p.schoolId === winner)?.name} | scores: ${Object.values(customScores).join('/')}`);
    }

    console.log('\n====================================');
    console.log(`Settled: ${settledCount}/${day2Results.length}`);
    if (failures.length > 0) {
        console.log('FAILURES:');
        failures.forEach((f) => console.log('  - ' + f));
        process.exit(1);
    }
}

run().catch(console.error).finally(() => process.exit(0));
