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
// REMOVE DUMMY QUARTER-FINAL DATA - NSMQ 2026
// Deletes the seeded dummy QF fixtures and any
// user predictions recorded against them.
// Run: npx tsx scripts/cleanup-nsmq-dummy-qf.ts --commit
// ============================================

async function main() {
    console.log(`=== NSMQ 2026 DUMMY QF CLEANUP (${COMMIT ? 'COMMIT' : 'DRY RUN'}) ===\n`);

    const dummyMatches = await sql`
        SELECT id, stage FROM matches
        WHERE id LIKE 'nsmq-2026-q%' AND metadata->>'dummy' = 'true'
        ORDER BY id
    `;
    console.log(`Dummy QF fixtures found: ${dummyMatches.length}`);
    dummyMatches.forEach((m: any) => console.log(`  ${m.id} (${m.stage})`));

    const predCount = await sql`SELECT COUNT(*)::int AS c FROM quarter_final_predictions`;
    console.log(`Quarter-Final prediction rows: ${predCount[0].c}`);

    if (!COMMIT) {
        console.log('\nDRY RUN ONLY - rerun with --commit to delete.');
        return;
    }

    const delPreds = await sql`DELETE FROM quarter_final_predictions`;
    console.log(`Deleted ${delPreds.length} prediction rows.`);

    const delMatches = await sql`
        DELETE FROM matches
        WHERE id LIKE 'nsmq-2026-q%' AND metadata->>'dummy' = 'true'
    `;
    console.log(`Deleted ${delMatches.length} dummy QF fixtures.`);

    console.log('\nDone. Dummy QF draw removed; the platform is back to real fixtures only.');
}

main().catch((e) => { console.error('ERR:', e.message); process.exit(1); });