import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log("Checking pending results...");
    if (!process.env.DATABASE_URL) throw new Error("No DB URL");
    const sql = neon(process.env.DATABASE_URL);
    
    const pending = await sql`SELECT id, parsed_data FROM pending_results WHERE status = 'pending'`;
    console.log(`Found ${pending.length} pending results`);
    
    for (const p of pending) {
        console.log("Pending result ID:", p.id);
        const parsed = typeof p.parsed_data === 'string' ? JSON.parse(p.parsed_data) : p.parsed_data;
        console.log("Scores:", parsed.scores);
        
        const allMatches = await sql`SELECT id, participants FROM matches`;
        let targetMatch = null;
        
        for (const m of allMatches) {
            const participants = typeof m.participants === 'string' ? JSON.parse(m.participants) : m.participants;
            const pNames = (participants || []).map((x: any) => x.name.toLowerCase());
            
            let isMatch = true;
            if (parsed.scores) {
                for (const ps of parsed.scores) {
                    if (!pNames.some((name: string) => name.includes(ps.schoolName.toLowerCase()) || ps.schoolName.toLowerCase().includes(name))) {
                        isMatch = false;
                        break;
                    }
                }
            } else {
                isMatch = false;
            }
            
            if (isMatch) {
                targetMatch = m;
                break;
            }
        }
        
        if (targetMatch) {
            console.log("-> MATCH FOUND:", targetMatch.id);
        } else {
            console.log("-> NO MATCH FOUND for these schools!");
        }
    }
}

run().catch(console.error).finally(() => process.exit(0));
