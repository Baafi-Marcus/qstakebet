import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

async function check() {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check match dates
    const data = await sql`
        SELECT id, scheduled_at, status 
        FROM matches 
        ORDER BY scheduled_at ASC
    `;
    
    console.log(data);
}

check().catch(console.error);
