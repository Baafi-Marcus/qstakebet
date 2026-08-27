const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is missing!");
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log("Connected to DB. Creating tables...");

        await client.query(`
            CREATE TABLE IF NOT EXISTS semi_final_predictions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                predictions JSONB NOT NULL,
                points_earned INTEGER DEFAULT 0 NOT NULL,
                is_locked BOOLEAN DEFAULT false NOT NULL,
                locked_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now()
            );
        `);
        console.log("semi_final_predictions table created or verified.");

        await client.query(`
            CREATE TABLE IF NOT EXISTS grand_final_predictions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                champion_school_id TEXT REFERENCES schools(id),
                runner_up_school_id TEXT REFERENCES schools(id),
                margin_range TEXT,
                final_boost TEXT,
                points_earned INTEGER DEFAULT 0 NOT NULL,
                is_locked BOOLEAN DEFAULT false NOT NULL,
                locked_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now()
            );
        `);
        console.log("grand_final_predictions table created or verified.");

        console.log("All tables successfully pushed!");
    } catch (err) {
        console.error("SQL Execution failed:", err);
    } finally {
        await client.end();
    }
}

main();
