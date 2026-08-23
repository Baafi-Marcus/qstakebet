import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// ============================================
// DAY 3 RESULTS - NSMQ 2026 Preliminary Stage
// Append each contest's "End of Contest" scores + round-by-round below.
// Fantasy points are settled afterwards via repair-fantasy-points.ts.
// ============================================
type Round = { label: string; scores: Record<string, number> };

const day3Results: Array<{
    matchId: string;
    label: string;
    scores: Array<{ schoolName: string; score: number }>;
    rounds?: Array<{ label: string; scores: Array<{ schoolName: string; score: number }> }>;
}> = [
    {
        matchId: 'nsmq-2026-m22', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'Wesley Grammar School', score: 46 },
            { schoolName: 'Kofi Agyei SHTS', score: 41 },
            { schoolName: 'Yilo Krobo SHS', score: 27 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Wesley Grammar School', score: 20 }, { schoolName: 'Kofi Agyei SHTS', score: 19 }, { schoolName: 'Yilo Krobo SHS', score: 14 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Wesley Grammar School', score: 30 }, { schoolName: 'Kofi Agyei SHTS', score: 22 }, { schoolName: 'Yilo Krobo SHS', score: 14 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Wesley Grammar School', score: 33 }, { schoolName: 'Kofi Agyei SHTS', score: 25 }, { schoolName: 'Yilo Krobo SHS', score: 17 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Wesley Grammar School', score: 43 }, { schoolName: 'Kofi Agyei SHTS', score: 35 }, { schoolName: 'Yilo Krobo SHS', score: 24 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Wesley Grammar School', score: 46 }, { schoolName: 'Kofi Agyei SHTS', score: 41 }, { schoolName: 'Yilo Krobo SHS', score: 27 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m23', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Adiembra SHS', score: 54 },
            { schoolName: 'T. I. Amass, Kumasi', score: 46 },
            { schoolName: 'Presby SHS, Bechem', score: 29 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'T. I. Amass, Kumasi', score: 23 }, { schoolName: 'Adiembra SHS', score: 17 }, { schoolName: 'Presby SHS, Bechem', score: 13 }] },
            { label: 'Round 2', scores: [{ schoolName: 'T. I. Amass, Kumasi', score: 32 }, { schoolName: 'Adiembra SHS', score: 30 }, { schoolName: 'Presby SHS, Bechem', score: 13 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Adiembra SHS', score: 36 }, { schoolName: 'T. I. Amass, Kumasi', score: 33 }, { schoolName: 'Presby SHS, Bechem', score: 16 }] },
            { label: 'Round 4', scores: [{ schoolName: 'T. I. Amass, Kumasi', score: 46 }, { schoolName: 'Adiembra SHS', score: 43 }, { schoolName: 'Presby SHS, Bechem', score: 26 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Adiembra SHS', score: 54 }, { schoolName: 'T. I. Amass, Kumasi', score: 46 }, { schoolName: 'Presby SHS, Bechem', score: 29 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m24', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Presby SHTS, Aburi', score: 51 },
            { schoolName: 'Ola SHS, Ho', score: 41 },
            { schoolName: "Our Lady of Lourdes Girls'", score: 13 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Presby SHTS, Aburi', score: 23 }, { schoolName: 'Ola SHS, Ho', score: 18 }, { schoolName: "Our Lady of Lourdes Girls'", score: 3 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Presby SHTS, Aburi', score: 32 }, { schoolName: 'Ola SHS, Ho', score: 20 }, { schoolName: "Our Lady of Lourdes Girls'", score: 6 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Presby SHTS, Aburi', score: 35 }, { schoolName: 'Ola SHS, Ho', score: 23 }, { schoolName: "Our Lady of Lourdes Girls'", score: 8 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Presby SHTS, Aburi', score: 48 }, { schoolName: 'Ola SHS, Ho', score: 32 }, { schoolName: "Our Lady of Lourdes Girls'", score: 13 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Presby SHTS, Aburi', score: 51 }, { schoolName: 'Ola SHS, Ho', score: 41 }, { schoolName: "Our Lady of Lourdes Girls'", score: 13 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m25', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'West Africa SHS', score: 55 },
            { schoolName: 'Oda SHS', score: 35 },
            { schoolName: 'Mankessim SHTS', score: 31 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'West Africa SHS', score: 25 }, { schoolName: 'Mankessim SHTS', score: 15 }, { schoolName: 'Oda SHS', score: 14 }] },
            { label: 'Round 2', scores: [{ schoolName: 'West Africa SHS', score: 36 }, { schoolName: 'Mankessim SHTS', score: 20 }, { schoolName: 'Oda SHS', score: 16 }] },
            { label: 'Round 3', scores: [{ schoolName: 'West Africa SHS', score: 42 }, { schoolName: 'Mankessim SHTS', score: 27 }, { schoolName: 'Oda SHS', score: 22 }] },
            { label: 'Round 4', scores: [{ schoolName: 'West Africa SHS', score: 55 }, { schoolName: 'Oda SHS', score: 35 }, { schoolName: 'Mankessim SHTS', score: 31 }] },
            { label: 'Round 5', scores: [{ schoolName: 'West Africa SHS', score: 55 }, { schoolName: 'Oda SHS', score: 35 }, { schoolName: 'Mankessim SHTS', score: 31 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m26', label: 'SMS Auditorium',
        scores: [
            { schoolName: "St. John's Grammar Sch.", score: 60 },
            { schoolName: 'Zion College', score: 36 },
            { schoolName: "St. Mary's Sem. SHS, Lolobi", score: 15 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: "St. John's Grammar Sch.", score: 25 }, { schoolName: 'Zion College', score: 13 }, { schoolName: "St. Mary's Sem. SHS, Lolobi", score: 7 }] },
            { label: 'Round 2', scores: [{ schoolName: "St. John's Grammar Sch.", score: 38 }, { schoolName: 'Zion College', score: 12 }, { schoolName: "St. Mary's Sem. SHS, Lolobi", score: 3 }] },
            { label: 'Round 3', scores: [{ schoolName: "St. John's Grammar Sch.", score: 47 }, { schoolName: 'Zion College', score: 17 }, { schoolName: "St. Mary's Sem. SHS, Lolobi", score: 5 }] },
            { label: 'Round 4', scores: [{ schoolName: "St. John's Grammar Sch.", score: 54 }, { schoolName: 'Zion College', score: 33 }, { schoolName: "St. Mary's Sem. SHS, Lolobi", score: 15 }] },
            { label: 'Round 5', scores: [{ schoolName: "St. John's Grammar Sch.", score: 60 }, { schoolName: 'Zion College', score: 36 }, { schoolName: "St. Mary's Sem. SHS, Lolobi", score: 15 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m27', label: 'CNC Auditorium',
        scores: [
            { schoolName: "Mfantsiman Girls' SHS", score: 60 },
            { schoolName: 'Kade SHTS', score: 36 },
            { schoolName: "Serwaa Kesse Girls' SHS", score: 33 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: "Mfantsiman Girls' SHS", score: 23 }, { schoolName: 'Kade SHTS', score: 21 }, { schoolName: "Serwaa Kesse Girls' SHS", score: 12 }] },
            { label: 'Round 2', scores: [{ schoolName: "Mfantsiman Girls' SHS", score: 33 }, { schoolName: 'Kade SHTS', score: 18 }, { schoolName: "Serwaa Kesse Girls' SHS", score: 11 }] },
            { label: 'Round 3', scores: [{ schoolName: "Mfantsiman Girls' SHS", score: 41 }, { schoolName: 'Kade SHTS', score: 20 }, { schoolName: "Serwaa Kesse Girls' SHS", score: 17 }] },
            { label: 'Round 4', scores: [{ schoolName: "Mfantsiman Girls' SHS", score: 57 }, { schoolName: 'Kade SHTS', score: 30 }, { schoolName: "Serwaa Kesse Girls' SHS", score: 30 }] },
            { label: 'Round 5', scores: [{ schoolName: "Mfantsiman Girls' SHS", score: 60 }, { schoolName: 'Kade SHTS', score: 36 }, { schoolName: "Serwaa Kesse Girls' SHS", score: 33 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m28', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'Anum Presby SHS', score: 35 },
            { schoolName: 'St. Charles Min. Sem.', score: 30 },
            { schoolName: 'Manya Krobo SHS', score: 18 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Anum Presby SHS', score: 15 }, { schoolName: 'Manya Krobo SHS', score: 15 }, { schoolName: 'St. Charles Min. Sem.', score: 11 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Anum Presby SHS', score: 19 }, { schoolName: 'St. Charles Min. Sem.', score: 16 }, { schoolName: 'Manya Krobo SHS', score: 13 }] },
            { label: 'Round 3', scores: [{ schoolName: 'St. Charles Min. Sem.', score: 23 }, { schoolName: 'Anum Presby SHS', score: 22 }, { schoolName: 'Manya Krobo SHS', score: 14 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Anum Presby SHS', score: 29 }, { schoolName: 'St. Charles Min. Sem.', score: 27 }, { schoolName: 'Manya Krobo SHS', score: 15 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Anum Presby SHS', score: 35 }, { schoolName: 'St. Charles Min. Sem.', score: 30 }, { schoolName: 'Manya Krobo SHS', score: 18 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m29', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Kumasi Academy', score: 58 },
            { schoolName: 'Bueman SHS', score: 39 },
            { schoolName: 'Hohoe E. P. SHS', score: 27 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Hohoe E. P. SHS', score: 22 }, { schoolName: 'Kumasi Academy', score: 20 }, { schoolName: 'Bueman SHS', score: 18 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Kumasi Academy', score: 26 }, { schoolName: 'Bueman SHS', score: 25 }, { schoolName: 'Hohoe E. P. SHS', score: 18 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Kumasi Academy', score: 33 }, { schoolName: 'Bueman SHS', score: 26 }, { schoolName: 'Hohoe E. P. SHS', score: 23 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Kumasi Academy', score: 46 }, { schoolName: 'Bueman SHS', score: 39 }, { schoolName: 'Hohoe E. P. SHS', score: 27 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Kumasi Academy', score: 58 }, { schoolName: 'Bueman SHS', score: 39 }, { schoolName: 'Hohoe E. P. SHS', score: 27 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m30', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Kumasi Sec. Tech.', score: 49 },
            { schoolName: "St. Mary's SHS", score: 34 },
            { schoolName: 'Agona SHTS', score: 24 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Kumasi Sec. Tech.', score: 26 }, { schoolName: "St. Mary's SHS", score: 19 }, { schoolName: 'Agona SHTS', score: 9 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Kumasi Sec. Tech.', score: 26 }, { schoolName: "St. Mary's SHS", score: 19 }, { schoolName: 'Agona SHTS', score: 7 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Kumasi Sec. Tech.', score: 27 }, { schoolName: "St. Mary's SHS", score: 24 }, { schoolName: 'Agona SHTS', score: 8 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Kumasi Sec. Tech.', score: 40 }, { schoolName: "St. Mary's SHS", score: 31 }, { schoolName: 'Agona SHTS', score: 24 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Kumasi Sec. Tech.', score: 49 }, { schoolName: "St. Mary's SHS", score: 34 }, { schoolName: 'Agona SHTS', score: 24 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m31', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'Asanteman SHS', score: 68 },
            { schoolName: 'Senya SHS', score: 48 },
            { schoolName: 'Awe SHTS', score: 33 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Asanteman SHS', score: 25 }, { schoolName: 'Senya SHS', score: 25 }, { schoolName: 'Awe SHTS', score: 11 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Asanteman SHS', score: 36 }, { schoolName: 'Senya SHS', score: 27 }, { schoolName: 'Awe SHTS', score: 13 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Asanteman SHS', score: 46 }, { schoolName: 'Senya SHS', score: 35 }, { schoolName: 'Awe SHTS', score: 17 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Asanteman SHS', score: 62 }, { schoolName: 'Senya SHS', score: 48 }, { schoolName: 'Awe SHTS', score: 30 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Asanteman SHS', score: 68 }, { schoolName: 'Senya SHS', score: 48 }, { schoolName: 'Awe SHTS', score: 33 }] },
        ],
    },
    // --- Extra contests played ahead of their Aug-23 slot; settling early ---
    {
        matchId: 'nsmq-2026-m32', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Boa Amponsem SHS', score: 55 },
            { schoolName: 'Berekum SHS', score: 30 },
            { schoolName: "Bolgatanga Girls' SHS", score: 29 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Boa Amponsem SHS', score: 26 }, { schoolName: 'Berekum SHS', score: 20 }, { schoolName: "Bolgatanga Girls' SHS", score: 12 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Boa Amponsem SHS', score: 31 }, { schoolName: 'Berekum SHS', score: 17 }, { schoolName: "Bolgatanga Girls' SHS", score: 13 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Boa Amponsem SHS', score: 39 }, { schoolName: 'Berekum SHS', score: 20 }, { schoolName: "Bolgatanga Girls' SHS", score: 16 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Boa Amponsem SHS', score: 52 }, { schoolName: 'Berekum SHS', score: 27 }, { schoolName: "Bolgatanga Girls' SHS", score: 26 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Boa Amponsem SHS', score: 55 }, { schoolName: 'Berekum SHS', score: 30 }, { schoolName: "Bolgatanga Girls' SHS", score: 29 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m33', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Presby SHTS, Adeiso', score: 50 },
            { schoolName: 'Wovenu SHTS', score: 44 },
            { schoolName: 'Vakpo SHS', score: 37 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Presby SHTS, Adeiso', score: 25 }, { schoolName: 'Vakpo SHS', score: 22 }, { schoolName: 'Wovenu SHTS', score: 21 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Presby SHTS, Adeiso', score: 28 }, { schoolName: 'Vakpo SHS', score: 24 }, { schoolName: 'Wovenu SHTS', score: 22 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Vakpo SHS', score: 33 }, { schoolName: 'Wovenu SHTS', score: 31 }, { schoolName: 'Presby SHTS, Adeiso', score: 31 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Wovenu SHTS', score: 44 }, { schoolName: 'Presby SHTS, Adeiso', score: 41 }, { schoolName: 'Vakpo SHS', score: 37 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Presby SHTS, Adeiso', score: 50 }, { schoolName: 'Wovenu SHTS', score: 44 }, { schoolName: 'Vakpo SHS', score: 37 }] },
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
    console.log('=== SETTLING NSMQ 2026 DAY 3 ===');
    if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
    const sql = neon(process.env.DATABASE_URL);

    let settledCount = 0;
    const failures: string[] = [];

    for (const entry of day3Results) {
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

        // Round-by-round keyed by schoolId (when provided)
        let rounds: Round[] | undefined;
        if (entry.rounds?.length) {
            rounds = entry.rounds.map(rd => {
                const rs: Record<string, number> = {};
                for (const s of rd.scores) {
                    const p = parts.find(x => nameMatches(x.name, s.schoolName) || nameMatches(s.schoolName, x.name));
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
                'system', ${JSON.stringify({ source: 'day3-manual-settlement', auditorium: entry.label })}::jsonb,
                NOW()
            )
        `;

        // 3. Update the match itself (consistent with Days 1-2: status='settled')
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
        console.log(`OK   ${entry.matchId} (${entry.label}) -> winner=${parts.find((p) => p.schoolId === winner)?.name} | scores: ${Object.values(customScores).join('/')} | rounds: ${rounds?.length ?? 0}`);
    }

    console.log('\n====================================');
    console.log(`Settled: ${settledCount}/${day3Results.length}`);
    if (failures.length > 0) {
        console.log('FAILURES:');
        failures.forEach((f) => console.log('  - ' + f));
        process.exit(1);
    }
}

run().catch(console.error).finally(() => process.exit(0));
