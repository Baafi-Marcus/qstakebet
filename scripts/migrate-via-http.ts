import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.local" })

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing")
    process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function main() {
    try {
        console.log("🚀 Starting database migration via HTTPS...")

        // 1. Update existing tables
        console.log("Updating 'schools' table columns...")
        await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS tier text DEFAULT '4' NOT NULL;`
        await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS credit_cost integer DEFAULT 10 NOT NULL;`

        console.log("Updating 'users' table columns...")
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS alma_mater text;`
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_points integer DEFAULT 0 NOT NULL;`

        // 2. Create new tables
        console.log("Creating 'fantasy_lineups' table...")
        await sql`
            CREATE TABLE IF NOT EXISTS fantasy_lineups (
                id text PRIMARY KEY,
                user_id text NOT NULL,
                game_week text NOT NULL,
                school1_id text NOT NULL,
                school2_id text NOT NULL,
                school3_id text NOT NULL,
                points_breakdown jsonb DEFAULT '{}'::jsonb NOT NULL,
                created_at timestamp DEFAULT now()
            );
        `

        console.log("Creating 'chat_messages' table...")
        await sql`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id text PRIMARY KEY,
                user_id text NOT NULL,
                channel text NOT NULL,
                message text NOT NULL,
                created_at timestamp DEFAULT now()
            );
        `

        console.log("Creating 'scraped_results' table...")
        await sql`
            CREATE TABLE IF NOT EXISTS scraped_results (
                id text PRIMARY KEY,
                match_id text NOT NULL,
                raw_html text NOT NULL,
                parsed_data jsonb NOT NULL,
                scraped_at timestamp DEFAULT now()
            );
        `

        console.log("✅ Schema migration successfully completed!")

        // 3. Seeding school tiers
        console.log("Seeding school tiers and credit costs...")
        
        // Define tiers
        const tier1 = ["presec", "presec, legon", "prempeh", "prempeh college", "keta scts", "keta sst", "keta school", "keta senior high", "mantsipim", "mantsipim school", "mfantsipim", "mfantsipim school", "st. augustine", "st. augustine's", "st. augustine's college", "adabrakabr"]
        const tier2 = ["achimota", "achimoto school", "wesley girls", "wesley girls' high school", "st. peter's", "st. peter's shs", "st. thomas aquinas", "opoku ware", "opoku ware school", "owass", "st. james seminary", "aburi girls", "aburi girls' shs"]
        const tier3 = ["accra academy", "holy child", "st. john's", "st. john's school", "pope john", "pope john shs", "gstsc", "ghana secondary technical", "st. hubert", "adisco", "adadisan college", "adisadel", "adisadel college", "tamale shs"]

        const allSchools = await sql`SELECT id, name FROM schools;`
        console.log(`Found ${allSchools.length} schools to update...`)

        let updatedCount = 0
        for (const school of allSchools) {
            const nameLower = school.name.toLowerCase()
            let tier = "4"
            let cost = 10

            if (tier1.some(t => nameLower.includes(t))) {
                tier = "1"
                cost = 45
            } else if (tier2.some(t => nameLower.includes(t))) {
                tier = "2"
                cost = 30
            } else if (tier3.some(t => nameLower.includes(t))) {
                tier = "3"
                cost = 20
            }

            await sql`
                UPDATE schools 
                SET tier = ${tier}, credit_cost = ${cost} 
                WHERE id = ${school.id};
            `
            updatedCount++
        }

        console.log(`✅ SUCCESS: Configured tiers and credit costs for ${updatedCount} schools.`)
    } catch (error: any) {
        console.error("❌ Migration failed:", error.message || error)
    }
}

main()
