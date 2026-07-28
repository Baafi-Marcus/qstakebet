import "dotenv/config";
import { Client } from "pg";

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        console.log("Applying manual migration...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS pending_results (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                raw_text TEXT NOT NULL,
                parsed_data JSONB NOT NULL,
                status TEXT DEFAULT 'pending' NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Successfully created pending_results table.");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
    process.exit(0);
}

run();
