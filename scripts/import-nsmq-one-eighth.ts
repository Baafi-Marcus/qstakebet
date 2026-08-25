import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const COMMIT = process.argv.includes('--commit');

// ============================================
// ONE-EIGHTH STAGE DRAW - NSMQ 2026 (Aug 26-28)
// 27 contests -> m50-m76, 9/day, venue rotation MAIN -> SMS -> CNC
// ============================================

type Fixture = { n: number; date: string; venue: string; startTime: string; schools: string[] };

const VENUES = ['MAIN Auditorium', 'SMS Auditorium', 'CNC Auditorium'];
const DAYS = ['2026-08-26', '2026-08-27', '2026-08-28'];

const drawOrder: string[][] = [
    // Day 1
    ['Prempeh College', 'West Africa SHS', "Kumasi Girls' SHS"],
    ['Keta SHS', 'Kadjebi Asato', 'Anum Presby SHS'],
    ['Ghana National College', 'Presby SHS, Suhum', "St. Monica's SHS"],
    ['Osei Tutu SHS', 'Presby SHTS, Osino', "Ahantaman Girls' SHS"],
    ["St. Peter's SHS", 'Ofori Panin SHS', 'Winneba SHS'],
    ['Pope John Minor Seminary & SHS', 'Sogakope SHS', 'Sonrise Christian High School'],
    ['Mpasatia SHS', "St. John's Grammar SHS", 'Tema Secondary School'],
    ["Aburi Girls' SHS", 'St. Joseph Seminary SHS', 'Fafraha Community Day SHS'],
    ["St. Augustine's College", 'Anlo SHS', 'Kumasi High School'],
    // Day 2
    ['Koforidua Sec. Tech. Sch.', 'St. Francis Xavier Jr. Sem.', 'Labone SHS'],
    ['Mawuli School', 'St. Hubert Sem. SHS', 'Konongo Odumase'],
    ['St. Thomas Aquinas SHS', 'Tamale SHS', 'Edinaman SHS'],
    ['St. James Sem. SHS', "Mfantsiman Girls' SHS", 'Wesley High School, Bekwai'],
    ["St. John's School", 'Benkum SHS', 'Nandom SHS'],
    ['Swedru Sec. Tech. School', 'Kpando SHS', 'Saviour SHS'],
    ['PRESEC, Legon', 'St. Louis', 'Islamic SHS, Kumasi'],
    ['OLAG SHS', 'Presby SHS, Bompata', 'Kumasi Sec. Tech.'],
    ["Mfantsipim School", "Wesley Girls' High School", "Afua Kobi Ampem Girls' SHS"],
    // Day 3
    ['Amaniampong SHS', 'Ghanata SHS', 'Tepa SHS'],
    ['Mankranso SHS', 'Anglican SHS, Kumasi', 'Chemu SHTS'],
    ['GSTS', 'Presby SHTS, Aburi', 'Bright SHS'],
    ['Achimota School', "Accra Girls' SHS", 'Accra High School'],
    ['Abetifi Presby SHS', 'Boa Amponsem SHS', 'Nsutaman Cath. School'],
    ['Adisadel College', 'Kumasi Academy', 'Wesley Grammar School'],
    ['Accra Academy', 'Holy Child School', 'Senya SHS'],
    ['University Practice SHS', 'Adiembra SHS', 'Presby SHS, Adeiso'],
    ['Opoku Ware School', 'Asanteman SHS', 'Bishop Herman College'],
];

const fixtures: Fixture[] = drawOrder.map((schools, i) => ({
    n: 50 + i,
    date: `${DAYS[Math.floor(i / 9)]}T11:00:00.000Z`,
    venue: VENUES[i % 3],
    startTime: '11:00 AM',
    schools,
}));

// ---- Explicit overrides: verified against DB (see audit) ----
const OVERRIDES: Record<string, string> = {
    'Prempeh College': 'prempeh-college',
    'Keta SHS': 'sch-ketasco',                                   // KETASCO
    'Osei Tutu SHS': 'e22904b7-4060-46dc-adf1-bac1e3685ea3',     // Osei Tutu Senior High, Akropong
    "St. Peter's SHS": 'st-peter-shs',
    'Pope John Minor Seminary & SHS': '9e3e7d9a-5c24-40a3-9712-f402af0920e9',
    "St. Augustine's College": '8057408e-7f21-4621-9ea6-81d972fd0493', // Cape Coast
    'Koforidua Sec. Tech. Sch.': 'b351f7eb-208f-4989-85a6-ff48bd93b806',
    'Mawuli School': 'b88c514c-b100-4d4d-a9a2-11d73fbaa6f7',     // Mawuli School, Ho
    'St. Thomas Aquinas SHS': '412478e8-7417-4cae-97b2-378b1e590b6c', // Cantonments
    'St. James Sem. SHS': '85fcb437-53c0-4a5a-aa49-f4d606b80286', // Abesim, Bono
    "St. John's School": '4f963424-5c1c-4e41-a904-368e4d8ffbdf', // Sekondi
    'Winneba SHS': '512d1d94-6286-4842-8fa9-e8515a8c3a53',       // Winneba Secondary School (same school; prelims row)
    'Swedru Sec. Tech. School': 'f8f5c4e4-0ed0-4dfc-9ede-c132005983ff', // Swedru Senior High
    'Mfantsipim School': 'mfantsipim-school',
    'Achimota School': 'achimota-school',
    'Opoku Ware School': 'opoku-ware-school',
    'Amaniampong SHS': '2e2d8982-0681-4371-a95a-1f3c120e352b',
    'Mankranso SHS': 'fd382be3-23c4-4ff0-967a-85a409ba5574',
    'Abetifi Presby SHS': '34833bcd-38a7-45fe-bc26-6f5485df4246',
    'University Practice SHS': '28cce675-e1b8-472a-bb51-dd611d9f2161',
    'Accra Academy': '3955a0e2-c185-43bd-8ad2-b34be838d602',
    'Adisadel College': '20da52a6-0d3b-4b54-b34c-e5456c085382',
    'Mpasatia SHS': '949a0c04-2601-414d-8654-32a7c3c2b0aa',      // Mpasatia Senior High/Tech
};

// New schools entering at this stage (not in DB) - explicitly defined, never heuristic
const NEW_SCHOOLS: Record<string, { name: string; region: string; gender: string; aliases: string[] }> = {
    'GSTS': { name: 'Ghana Secondary Technical School (GSTS)', region: 'Western', gender: 'male', aliases: ['GSTS', 'Ghanatta'] },
    'OLAG SHS': { name: "Our Lady of Grace SHS (OLAG)", region: 'Ashanti', gender: 'female', aliases: ['OLAG'] },
    "Aburi Girls' SHS": { name: "Aburi Girls' Senior High", region: 'Eastern', gender: 'female', aliases: [] },
};
const PROVISIONAL = new Set<string>();

// ---- Name normalization & fuzzy matching ----
function norm(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

const GENERIC = new Set([
    'shs', 'shts', 'school', 'senior', 'high', 'sem', 'seminary', 'secondary', 'sec',
    'comm', 'community', 'day', 'technical', 'tech', 'snr', 'jnr', 'jr', 'sch', 'stem', 'college',
]);

function sig(s: string): string[] {
    return norm(s).split(' ').filter((t) => t && !GENERIC.has(t));
}

function sigEq(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((t, i) => t === b[i]);
}

interface Candidate { id: string; name: string; source: string }

async function loadRoster(): Promise<Candidate[]> {
    const rows = await sql`
        SELECT participants FROM matches WHERE id LIKE 'nsmq-2026-m%'
    `;
    const map = new Map<string, Candidate>();
    for (const r of rows) {
        const parts = typeof r.participants === 'string' ? JSON.parse(r.participants) : r.participants;
        for (const p of parts) {
            if (!map.has(p.schoolId)) map.set(p.schoolId, { id: p.schoolId, name: p.name, source: 'roster' });
        }
    }
    console.log(`Competition roster: ${map.size} schools from prior contests\n`);
    return [...map.values()];
}

// Tiered matching: later tiers only run when earlier ones yield nothing,
// so an exact name always beats a loose token overlap.
function findMatches(name: string, pool: Candidate[]): Candidate[] {
    const nName = norm(name);
    const sName = sig(name);

    const t1: Candidate[] = [];                       // 1. normalized full-name equality
    const t2: Candidate[] = [];                       // 2. significant-token signature equality
    const t3: Candidate[] = [];                       // 3. containment / token-prefix
    for (const c of pool) {
        const nCand = norm(c.name);
        const sCand = sig(c.name);
        if (nCand === nName) { t1.push(c); continue; }
        if (sigEq(sName, sCand)) { t2.push(c); continue; }
        if (nCand.includes(nName) || nName.includes(nCand)) { t3.push(c); continue; }
        if (sName.length === sCand.length && sName.length > 0 &&
            sName.every((tok, i) => tok === sCand[i] || tok.startsWith(sCand[i]) || sCand[i].startsWith(tok))) {
            t3.push(c); continue;
        }
        if (sName.length === 1 && sCand.length === 1 && sCand[0] === sName[0]) t3.push(c);
    }
    return t1.length > 0 ? t1 : t2.length > 0 ? t2 : t3;
}

function pickDeterministic(cands: Candidate[]): Candidate {
    // identical-name duplicate rows (e.g. two "Mfantsipim School"): prefer slug-style id, then lowest uuid
    const sorted = [...cands].sort((a, b) => {
        const aSlug = /^[a-z]+(-[a-z0-9]+)*$/.test(a.id) ? 0 : 1;
        const bSlug = /^[a-z]+(-[a-z0-9]+)*$/.test(b.id) ? 0 : 1;
        if (aSlug !== bSlug) return aSlug - bSlug;
        return a.id < b.id ? -1 : 1;
    });
    return sorted[0];
}

function guessRegion(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('kumasi') || n.includes('ashanti') || n.includes('tepa') || n.includes('mankranso') || n.includes('amaniampong') || n.includes('mpraseo')) return 'Ashanti';
    if (n.includes('accra') || n.includes('tema') || n.includes('labone') || n.includes('aburi') || n.includes('legon') || n.includes('cantonments')) return 'Greater Accra';
    if (n.includes('tamale') || n.includes('yendi') || n.includes('navrongo')) return 'Northern';
    if (n.includes('koforidua') || n.includes('aburi') || n.includes('suhum') || n.includes('abetifi') || n.includes('osino') || n.includes('adeiso') || n.includes('akropong')) return 'Eastern';
    if (n.includes('ho ') || n.includes('kpando') || n.includes('anlo') || n.includes('sogakope') || n.includes('keta')) return 'Volta';
    if (n.includes('cape coast') || n.includes('mfantsiman') || n.includes('winneba') || n.includes('swedru') || n.includes('senya') || n.includes('apam')) return 'Central';
    if (n.includes('sekondi') || n.includes('takoradi') || n.includes('fijai') || n.includes('gsts')) return 'Western';
    if (n.includes('sunyani') || n.includes('berekum') || n.includes('wenchi')) return 'Bono';
    return 'National';
}

async function ensureSchool(entry: { key: string; def?: { name: string; region: string; gender: string; aliases: string[] } }): Promise<string> {
    const def = entry.def!;
    const existing = await sql`SELECT id FROM schools WHERE LOWER(name) = LOWER(${def.name})`;
    if (existing.length > 0) return existing[0].id;
    const newId = `sch-${norm(def.name).replace(/\s+/g, '-')}-${crypto.randomUUID().slice(0, 8)}`;
    await sql`
        INSERT INTO schools (id, name, region, level, type, aliases, created_at)
        VALUES (${newId}, ${def.name}, ${def.region}, 'shs', 'school', ${JSON.stringify(def.aliases)}::jsonb, NOW())
    `;
    console.log(`   + created school "${def.name}" (${def.region}) id=${newId}`);
    return newId;
}

async function main() {
    console.log(`=== NSMQ 2026 ONE-EIGHTH STAGE IMPORT (${COMMIT ? 'COMMIT' : 'DRY RUN'}) ===\n`);
    const roster = await loadRoster();

    const dbRows = await sql`SELECT id, name FROM schools`;
    const dbPool: Candidate[] = dbRows.map((r: any) => ({ id: r.id, name: r.name, source: 'db' }));

    const resolution = new Map<string, { cand: Candidate | null; status: string }>();
    const failures: string[] = [];

    for (const f of fixtures) {
        for (const s of f.schools) {
            if (resolution.has(s)) continue;

            if (NEW_SCHOOLS[s]) {
                if (!COMMIT) {
                    resolution.set(s, { cand: null, status: `new->${NEW_SCHOOLS[s].name}` });
                } else {
                    try {
                        const id = await ensureSchool({ key: s, def: NEW_SCHOOLS[s] });
                        resolution.set(s, { cand: { id, name: NEW_SCHOOLS[s].name, source: 'created' }, status: 'created' });
                    } catch (e: any) {
                        failures.push(`${s}: create failed - ${e.message}`);
                        resolution.set(s, { cand: null, status: 'FAILED' });
                    }
                }
                continue;
            }

            if (OVERRIDES[s]) {
                const target = dbRows.find((r: any) => r.id === OVERRIDES[s]);
                if (!target) {
                    failures.push(`${s}: override id ${OVERRIDES[s]} not found in schools`);
                    resolution.set(s, { cand: null, status: 'FAILED' });
                } else {
                    const warn = PROVISIONAL.has(s) ? ' [PROVISIONAL]' : '';
                    console.log(`override: "${s}" -> ${target.name}${warn}`);
                    resolution.set(s, { cand: { id: target.id, name: target.name, source: 'override' }, status: 'ok' });
                }
                continue;
            }

            // roster first, then full table
            let cands = findMatches(s, roster);
            if (cands.length === 1) {
                resolution.set(s, { cand: cands[0], status: 'ok' });
                continue;
            }
            if (cands.length > 1) {
                failures.push(`"${s}": AMBIGUOUS roster matches -> ${cands.map((c) => `"${c.name}"`).join(', ')}`);
                resolution.set(s, { cand: null, status: 'AMBIGUOUS' });
                continue;
            }

            cands = findMatches(s, dbPool);
            if (cands.length === 1) {
                console.log(`db-match: "${s}" -> ${cands[0].name}`);
                resolution.set(s, { cand: { ...cands[0], source: 'db' }, status: 'ok' });
                continue;
            }
            if (cands.length > 1) {
                // identical-name duplicate rows: pick deterministically, others are true ambiguity
                const names = new Set(cands.map((c) => c.name));
                if (names.size === 1) {
                    const picked = pickDeterministic(cands);
                    console.log(`db-dedupe: "${s}" -> ${picked.name} (${picked.id}) among ${cands.length} identical rows`);
                    resolution.set(s, { cand: { ...picked, source: 'db-dedupe' }, status: 'ok' });
                } else {
                    failures.push(`"${s}": AMBIGUOUS db matches -> ${cands.map((c) => `"${c.name}"(${c.id.slice(0, 8)})`).join(', ')}`);
                    resolution.set(s, { cand: null, status: 'AMBIGUOUS' });
                }
                continue;
            }

            failures.push(`"${s}": no match found anywhere`);
            resolution.set(s, { cand: null, status: 'NOT FOUND' });
        }
    }

    // intra-draft sanity: no school twice while tournament ongoing
    const seen = new Map<string, number[]>();
    for (const f of fixtures) {
        for (const s of f.schools) {
            if (!seen.has(s)) seen.set(s, []);
            seen.get(s)!.push(f.n);
        }
    }
    for (const [s, ns] of seen) {
        if (ns.length > 1) failures.push(`DRAFT CONFLICT: "${s}" appears in contests ${ns.join(', ')}`);
    }

    console.log('\n--- FIXTURE PLAN ---');
    for (const f of fixtures) {
        const parts = f.schools.map((s) => {
            const r = resolution.get(s)!;
            const tag = r.cand ? `[${r.cand.source}]` : `[${r.status}]`;
            const label = r.cand?.name ?? s;
            return `${label} ${tag}`;
        });
        console.log(`m${f.n} ${f.date.slice(0, 10)} ${f.venue.padEnd(16)} | ${parts.join(' vs ')}`);
    }

    console.log('\n====================================');
    if (failures.length > 0) {
        console.log('ISSUES:');
        failures.forEach((x) => console.log('  ! ' + x));
        process.exitCode = 1;
    } else {
        console.log('All 81 school slots resolved cleanly.');
    }

    if (!COMMIT) {
        console.log('\nDRY RUN ONLY - rerun with --commit to write matches.');
        return;
    }
    if (failures.length > 0) {
        console.log('\nRefusing to commit due to issues above.');
        return;
    }

    let inserted = 0, updated = 0;
    for (const f of fixtures) {
        const matchId = `nsmq-2026-m${f.n}`;
        const ids = f.schools.map((s) => resolution.get(s)!.cand!.id);
        const participants = f.schools.map((name, idx) => ({ schoolId: ids[idx], name, odd: 1.85 }));
        const odds = { 'Match Winner': Object.fromEntries(ids.map((id) => [id, 1.85])) };
        const existing = await sql`SELECT id FROM matches WHERE id = ${matchId}`;
        if (existing.length > 0) {
            await sql`
                UPDATE matches
                SET tournament_id = 'nsmq-2026',
                    participants = ${JSON.stringify(participants)},
                    start_time = ${f.startTime},
                    scheduled_at = ${f.date},
                    status = 'upcoming',
                    stage = 'One-Eighth Stage',
                    odds = ${JSON.stringify(odds)},
                    sport_type = 'quiz'
                WHERE id = ${matchId}
            `;
            updated++;
        } else {
            await sql`
                INSERT INTO matches (id, tournament_id, participants, start_time, scheduled_at, status, stage, odds, sport_type)
                VALUES (
                    ${matchId}, 'nsmq-2026',
                    ${JSON.stringify(participants)},
                    ${f.startTime}, ${f.date}, 'upcoming', 'One-Eighth Stage',
                    ${JSON.stringify(odds)}, 'quiz'
                )
            `;
            inserted++;
        }
    }
    console.log(`\nDone. inserted=${inserted} updated=${updated}`);
}

main().catch((e) => { console.error('ERR:', e.message); process.exit(1); });
