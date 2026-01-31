import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function robustFix() {
    console.log("Starting robust schema fix...");

    const statements = [
        `ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "tournament_id" text`,
        `ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "participants" jsonb DEFAULT '[]'::jsonb NOT NULL`,
        `ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "extended_odds" jsonb`,
        `ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "is_virtual" boolean DEFAULT false NOT NULL`,
        `ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "sport_type" text DEFAULT 'quiz' NOT NULL`,
        `ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "gender" text DEFAULT 'male' NOT NULL`,
        `ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "margin" jsonb DEFAULT '0.1'::jsonb NOT NULL`,
        `CREATE TABLE IF NOT EXISTS "tournaments" (
            "id" text PRIMARY KEY NOT NULL,
            "name" text NOT NULL,
            "region" text NOT NULL,
            "sport_type" text NOT NULL,
            "gender" text NOT NULL,
            "year" text NOT NULL,
            "status" text DEFAULT 'active' NOT NULL,
            "created_at" timestamp DEFAULT now()
        )`,
        `CREATE TABLE IF NOT EXISTS "school_strengths" (
            "id" text PRIMARY KEY NOT NULL,
            "school_id" text NOT NULL,
            "sport_type" text NOT NULL,
            "gender" text NOT NULL,
            "rating" jsonb NOT NULL,
            "updated_at" timestamp DEFAULT now()
        )`
    ];

    for (const stmt of statements) {
        console.log(`Executing: ${stmt.substring(0, 50)}...`);
        try {
            await (sql as any)(stmt);
            console.log("  Success.");
        } catch (err: any) {
            console.warn(`  Error: ${err.message}`);
        }
    }

    console.log("Robust fix completed!");
}

robustFix();
