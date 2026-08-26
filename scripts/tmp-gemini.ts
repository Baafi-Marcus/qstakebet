import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
async function main() {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT key FROM api_keys WHERE provider = 'gemini' AND is_active = true LIMIT 1`;
    const key = rows[0].key;
    console.log('key prefix:', key.slice(0, 6) + '...');

    for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }] })
        });
        const body = await res.text();
        console.log(`${model}: HTTP ${res.status} - ${body.slice(0, 150).replace(/\n/g, ' ')}`);
        if (res.ok) break;
    }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
