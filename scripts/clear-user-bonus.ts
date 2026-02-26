import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const sql = neon(process.env.DATABASE_URL!);

async function clearUserBonus(userId: string) {
    console.log(`Starting bonus wipe for user: ${userId}`);
    try {
        // 1. Delete all active bonuses for the user
        await sql`DELETE FROM bonuses WHERE user_id = ${userId}`;
        console.log("Deleted records from bonuses table");

        // 2. Reset the bonus balance in their wallet to 0
        await sql`UPDATE wallets SET bonus_balance = 0 WHERE user_id = ${userId}`;
        console.log("Reset bonus_balance in wallets table to 0");

        console.log("✅ Successfully cleared user bonus.");
    } catch (e) {
        console.error("❌ Error:", e);
    }
}

clearUserBonus('usr-7v66fsn2u');
