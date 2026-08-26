import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
async function main() {
    const sql = neon(process.env.DATABASE_URL);
    const times = await sql`
        SELECT DISTINCT scheduled_at::time AS t, COUNT(*)::int AS cnt
        FROM matches WHERE stage = 'One-Eighth Stage'
        GROUP BY scheduled_at::time ORDER BY t
    `;
    console.log('current kickoff times:', times);
    if (!process.argv.includes('--commit')) {
        console.log('DRY RUN - would set all One-Eighth fixtures to 09:00');
        return;
    }
    await sql`
        UPDATE matches
        SET scheduled_at = (scheduled_at::date + TIME '09:00:00')
        WHERE stage = 'One-Eighth Stage' AND status NOT IN ('finished', 'settled')
    `;
    const after = await sql`
        SELECT DATE(scheduled_at) AS d, scheduled_at::time AS t, COUNT(*)::int AS cnt
        FROM matches WHERE stage = 'One-Eighth Stage'
        GROUP BY DATE(scheduled_at), scheduled_at::time ORDER BY d
    `;
    console.log('after:', after);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
