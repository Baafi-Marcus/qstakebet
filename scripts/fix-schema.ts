import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function fixSchema() {
    console.log("Starting surgical schema fix...");

    try {
        // 1. Create tournaments table
        console.log("Creating tournaments table...");
        await sql`
            CREATE TABLE IF NOT EXISTS "tournaments" (
                "id" text PRIMARY KEY NOT NULL,
                "name" text NOT NULL,
                "region" text NOT NULL,
                "sport_type" text NOT NULL,
                "gender" text NOT NULL,
                "year" text NOT NULL,
                "status" text DEFAULT 'active' NOT NULL,
                "created_at" timestamp DEFAULT now()
            )
        `;

        // 2. Create school_strengths table
        console.log("Creating school_strengths table...");
        await sql`
            CREATE TABLE IF NOT EXISTS "school_strengths" (
                "id" text PRIMARY KEY NOT NULL,
                "school_id" text NOT NULL,
                "sport_type" text NOT NULL,
                "gender" text NOT NULL,
                "rating" jsonb NOT NULL,
                "updated_at" timestamp DEFAULT now()
            )
        `;

        // 3. Add missing columns to matches
        const columnsToAdd = [
            { name: "tournament_id", type: "text" },
            { name: "participants", type: "jsonb DEFAULT '[]'::jsonb NOT NULL" },
            { name: "extended_odds", type: "jsonb" },
            { name: "is_virtual", type: "boolean DEFAULT false NOT NULL" },
            { name: "sport_type", type: "text DEFAULT 'quiz' NOT NULL" },
            { name: "gender", type: "text DEFAULT 'male' NOT NULL" },
            { name: "margin", type: "jsonb DEFAULT '0.1'::jsonb NOT NULL" }
        ];

        for (const col of columnsToAdd) {
            console.log(`Adding column ${col.name} if it's missing...`);
            try {
                // Check if column exists
                const existing = await sql`
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'matches' AND column_name = ${col.name}
                `;
                if (existing.length === 0) {
                    await (sql as any)(`ALTER TABLE "matches" ADD COLUMN "${col.name}" ${col.type}`);
                    console.log(`  Added column ${col.name}.`);
                } else {
                    console.log(`  Column ${col.name} already exists.`);
                }
            } catch (err: any) {
                console.warn(`  Warning adding column ${col.name}: ${err.message}`);
            }
        }

        console.log("Schema fix completed successfully!");

    } catch (err: any) {
        console.error("Critical error during schema fix:", err.message);
    }
}

fixSchema();
