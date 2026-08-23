import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// ============================================
// DAY 4 RESULTS - NSMQ 2026 Preliminary Stage (Aug 23)
// Settles m34-m40 (today's slate) plus m41/m42 which were played
// ahead of their Aug-24 slot. Fantasy points settled afterwards
// via repair-fantasy-points.ts.
// ============================================
type Round = { label: string; scores: Record<string, number> };

const day4Results: Array<{
    matchId: string;
    label: string;
    scores: Array<{ schoolName: string; score: number }>;
    rounds?: Array<{ label: string; scores: Array<{ schoolName: string; score: number }> }>;
}> = [
    {
        matchId: 'nsmq-2026-m34', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'Bishop Herman College', score: 47 },
            { schoolName: 'Dabala SHTS', score: 37 },
            { schoolName: "Yaa Asantewaa Girls' SHS", score: 27 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Bishop Herman College', score: 24 }, { schoolName: 'Dabala SHTS', score: 15 }, { schoolName: "Yaa Asantewaa Girls' SHS", score: 11 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Bishop Herman College', score: 30 }, { schoolName: 'Dabala SHTS', score: 21 }, { schoolName: "Yaa Asantewaa Girls' SHS", score: 10 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Bishop Herman College', score: 37 }, { schoolName: 'Dabala SHTS', score: 24 }, { schoolName: "Yaa Asantewaa Girls' SHS", score: 14 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Bishop Herman College', score: 44 }, { schoolName: 'Dabala SHTS', score: 34 }, { schoolName: "Yaa Asantewaa Girls' SHS", score: 24 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Bishop Herman College', score: 47 }, { schoolName: 'Dabala SHTS', score: 37 }, { schoolName: "Yaa Asantewaa Girls' SHS", score: 27 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m35', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Holy Child School', score: 67 },
            { schoolName: 'Anlo SHS', score: 52 },
            { schoolName: 'Nkawkaw SHS', score: 35 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Holy Child School', score: 25 }, { schoolName: 'Anlo SHS', score: 24 }, { schoolName: 'Nkawkaw SHS', score: 21 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Holy Child School', score: 35 }, { schoolName: 'Anlo SHS', score: 26 }, { schoolName: 'Nkawkaw SHS', score: 20 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Holy Child School', score: 45 }, { schoolName: 'Anlo SHS', score: 36 }, { schoolName: 'Nkawkaw SHS', score: 25 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Holy Child School', score: 58 }, { schoolName: 'Anlo SHS', score: 52 }, { schoolName: 'Nkawkaw SHS', score: 32 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Holy Child School', score: 67 }, { schoolName: 'Anlo SHS', score: 52 }, { schoolName: 'Nkawkaw SHS', score: 35 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m36', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Nsutaman Cath. SHS', score: 50 },
            { schoolName: "Serwaa Nyarko Girls'", score: 41 },
            { schoolName: 'Hope College', score: 37 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: "Serwaa Nyarko Girls'", score: 20 }, { schoolName: 'Hope College', score: 17 }, { schoolName: 'Nsutaman Cath. SHS', score: 16 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Nsutaman Cath. SHS', score: 29 }, { schoolName: "Serwaa Nyarko Girls'", score: 21 }, { schoolName: 'Hope College', score: 15 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Nsutaman Cath. SHS', score: 37 }, { schoolName: "Serwaa Nyarko Girls'", score: 27 }, { schoolName: 'Hope College', score: 25 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Nsutaman Cath. SHS', score: 41 }, { schoolName: "Serwaa Nyarko Girls'", score: 38 }, { schoolName: 'Hope College', score: 37 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Nsutaman Cath. SHS', score: 50 }, { schoolName: "Serwaa Nyarko Girls'", score: 41 }, { schoolName: 'Hope College', score: 37 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m37', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'Kpando SHS', score: 67 },
            { schoolName: 'Abor SHS', score: 35 },
            { schoolName: 'Jukwa SHTS', score: 18 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Kpando SHS', score: 25 }, { schoolName: 'Abor SHS', score: 8 }, { schoolName: 'Jukwa SHTS', score: 13 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Kpando SHS', score: 25 }, { schoolName: 'Abor SHS', score: 8 }, { schoolName: 'Jukwa SHTS', score: 13 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Kpando SHS', score: 48 }, { schoolName: 'Abor SHS', score: 16 }, { schoolName: 'Jukwa SHTS', score: 14 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Kpando SHS', score: 61 }, { schoolName: 'Abor SHS', score: 29 }, { schoolName: 'Jukwa SHTS', score: 18 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Kpando SHS', score: 67 }, { schoolName: 'Abor SHS', score: 35 }, { schoolName: 'Jukwa SHTS', score: 18 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m38', label: 'SMS Auditorium',
        scores: [
            { schoolName: 'Fafraha Comm. SHS', score: 44 },
            { schoolName: 'Awudome SHS', score: 34 },
            { schoolName: 'Ejisuman SHS', score: 10 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Fafraha Comm. SHS', score: 17 }, { schoolName: 'Awudome SHS', score: 15 }, { schoolName: 'Ejisuman SHS', score: 8 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Fafraha Comm. SHS', score: 30 }, { schoolName: 'Awudome SHS', score: 14 }, { schoolName: 'Ejisuman SHS', score: 1 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Fafraha Comm. SHS', score: 34 }, { schoolName: 'Awudome SHS', score: 21 }, { schoolName: 'Ejisuman SHS', score: 6 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Fafraha Comm. SHS', score: 38 }, { schoolName: 'Awudome SHS', score: 31 }, { schoolName: 'Ejisuman SHS', score: 7 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Fafraha Comm. SHS', score: 44 }, { schoolName: 'Awudome SHS', score: 34 }, { schoolName: 'Ejisuman SHS', score: 10 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m39', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Presby SHS, Suhum', score: 55 },
            { schoolName: 'Navrongo SHS', score: 31 },
            { schoolName: 'Bepong SHS', score: 14 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Presby SHS, Suhum', score: 24 }, { schoolName: 'Navrongo SHS', score: 9 }, { schoolName: 'Bepong SHS', score: 7 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Presby SHS, Suhum', score: 34 }, { schoolName: 'Navrongo SHS', score: 10 }, { schoolName: 'Bepong SHS', score: 5 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Presby SHS, Suhum', score: 42 }, { schoolName: 'Navrongo SHS', score: 18 }, { schoolName: 'Bepong SHS', score: 7 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Presby SHS, Suhum', score: 55 }, { schoolName: 'Navrongo SHS', score: 25 }, { schoolName: 'Bepong SHS', score: 11 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Presby SHS, Suhum', score: 55 }, { schoolName: 'Navrongo SHS', score: 31 }, { schoolName: 'Bepong SHS', score: 14 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m40', label: 'MAIN Auditorium',
        scores: [
            { schoolName: 'Konongo Odumase SHS', score: 45 },
            { schoolName: "Our Lady of Mt. Carmel Girls'", score: 31 },
            { schoolName: 'Juaben SHS', score: 28 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Konongo Odumase SHS', score: 22 }, { schoolName: "Our Lady of Mt. Carmel Girls'", score: 21 }, { schoolName: 'Juaben SHS', score: 16 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Konongo Odumase SHS', score: 27 }, { schoolName: 'Juaben SHS', score: 24 }, { schoolName: "Our Lady of Mt. Carmel Girls'", score: 20 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Konongo Odumase SHS', score: 32 }, { schoolName: 'Juaben SHS', score: 24 }, { schoolName: "Our Lady of Mt. Carmel Girls'", score: 21 }] },
            // Round 4 was never tweeted for this contest; jumping to the final
            { label: 'Round 5', scores: [{ schoolName: 'Konongo Odumase SHS', score: 45 }, { schoolName: "Our Lady of Mt. Carmel Girls'", score: 31 }, { schoolName: 'Juaben SHS', score: 28 }] },
        ],
    },
    // --- Extra contests played ahead of their Aug-24 slot; settling early ---
    {
        matchId: 'nsmq-2026-m41', label: 'SMS Auditorium',
        scores: [
            { schoolName: "St. Monica's SHS", score: 40 },
            { schoolName: 'Amenfiman SHS', score: 37 },
            { schoolName: 'Tema Methodist Day', score: 15 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: "St. Monica's SHS", score: 17 }, { schoolName: 'Amenfiman SHS', score: 12 }, { schoolName: 'Tema Methodist Day', score: 8 }] },
            { label: 'Round 2', scores: [{ schoolName: "St. Monica's SHS", score: 21 }, { schoolName: 'Amenfiman SHS', score: 16 }, { schoolName: 'Tema Methodist Day', score: 8 }] },
            { label: 'Round 3', scores: [{ schoolName: "St. Monica's SHS", score: 27 }, { schoolName: 'Amenfiman SHS', score: 18 }, { schoolName: 'Tema Methodist Day', score: 8 }] },
            { label: 'Round 4', scores: [{ schoolName: "St. Monica's SHS", score: 40 }, { schoolName: 'Amenfiman SHS', score: 31 }, { schoolName: 'Tema Methodist Day', score: 15 }] },
            { label: 'Round 5', scores: [{ schoolName: "St. Monica's SHS", score: 40 }, { schoolName: 'Amenfiman SHS', score: 37 }, { schoolName: 'Tema Methodist Day', score: 15 }] },
        ],
    },
    {
        matchId: 'nsmq-2026-m42', label: 'CNC Auditorium',
        scores: [
            { schoolName: 'Accra High School', score: 33 },
            { schoolName: 'Ghana SHS, Tamale', score: 32 },
            { schoolName: 'Sunyani SHS', score: 31 },
        ],
        rounds: [
            { label: 'Round 1', scores: [{ schoolName: 'Accra High School', score: 23 }, { schoolName: 'Ghana SHS, Tamale', score: 18 }, { schoolName: 'Sunyani SHS', score: 18 }] },
            { label: 'Round 2', scores: [{ schoolName: 'Sunyani SHS', score: 22 }, { schoolName: 'Accra High School', score: 19 }, { schoolName: 'Ghana SHS, Tamale', score: 19 }] },
            { label: 'Round 3', scores: [{ schoolName: 'Sunyani SHS', score: 24 }, { schoolName: 'Ghana SHS, Tamale', score: 22 }, { schoolName: 'Accra High School', score: 20 }] },
            { label: 'Round 4', scores: [{ schoolName: 'Sunyani SHS', score: 31 }, { schoolName: 'Accra High School', score: 30 }, { schoolName: 'Ghana SHS, Tamale', score: 29 }] },
            { label: 'Round 5', scores: [{ schoolName: 'Accra High School', score: 33 }, { schoolName: 'Ghana SHS, Tamale', score: 32 }, { schoolName: 'Sunyani SHS', score: 31 }] },
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
    console.log('=== SETTLING NSMQ 2026 DAY 4 ===');
    if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
    const sql = neon(process.env.DATABASE_URL);

    let settledCount = 0;
    const failures: string[] = [];

    for (const entry of day4Results) {
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
                'system', ${JSON.stringify({ source: 'day4-manual-settlement', auditorium: entry.label })}::jsonb,
                NOW()
            )
        `;

        // 3. Update the match itself (consistent with Days 1-3: status='settled')
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
    console.log(`Settled: ${settledCount}/${day4Results.length}`);
    if (failures.length > 0) {
        console.log('FAILURES:');
        failures.forEach((f) => console.log('  - ' + f));
        process.exit(1);
    }
}

run().catch(console.error).finally(() => process.exit(0));
