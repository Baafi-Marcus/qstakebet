import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL!);

async function recreateTables() {
    console.log("🔥 Starting database reset...");
    try {
        // Drop everything with CASCADE to handle FKs
        console.log("Dropping tables...");
        await sql`DROP TABLE IF EXISTS "school_strengths" CASCADE`;
        await sql`DROP TABLE IF EXISTS "matches" CASCADE`;
        await sql`DROP TABLE IF EXISTS "tournaments" CASCADE`;
        await sql`DROP TABLE IF EXISTS "schools" CASCADE`;

        // Create Schools
        console.log("Creating schools...");
        await sql`
            CREATE TABLE "schools" (
                "id" text PRIMARY KEY NOT NULL,
                "name" text NOT NULL,
                "region" text NOT NULL,
                "district" text,
                "category" text,
                "location" text,
                "created_at" timestamp DEFAULT now()
            )
        `;

        // Create Tournaments
        console.log("Creating tournaments...");
        await sql`
            CREATE TABLE "tournaments" (
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

        // Create Matches
        console.log("Creating matches...");
        await sql`
            CREATE TABLE "matches" (
                "id" text PRIMARY KEY NOT NULL,
                "tournament_id" text REFERENCES "tournaments"("id"),
                "participants" jsonb NOT NULL,
                "start_time" text NOT NULL,
                "is_live" boolean DEFAULT false NOT NULL,
                "stage" text NOT NULL,
                "odds" jsonb NOT NULL,
                "extended_odds" jsonb,
                "is_virtual" boolean DEFAULT false NOT NULL,
                "sport_type" text DEFAULT 'quiz' NOT NULL,
                "gender" text DEFAULT 'male' NOT NULL,
                "margin" jsonb DEFAULT '0.1'::jsonb NOT NULL,
                "created_at" timestamp DEFAULT now()
            )
        `;

        // Create School Strengths
        console.log("Creating school_strengths...");
        await sql`
            CREATE TABLE "school_strengths" (
                "id" text PRIMARY KEY NOT NULL,
                "school_id" text NOT NULL REFERENCES "schools"("id"),
                "sport_type" text NOT NULL,
                "gender" text NOT NULL,
                "rating" jsonb NOT NULL,
                "updated_at" timestamp DEFAULT now()
            )
        `;

        console.log("✅ Database reset complete!");
    } catch (err: any) {
        console.error("❌ Reset failed:", err.message);
    }
}
recreateTables();
