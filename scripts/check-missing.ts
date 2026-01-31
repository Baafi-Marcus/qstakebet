import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

const EXPECTED_COLUMNS = [
    "id", "tournament_id", "participants", "start_time", "is_live",
    "stage", "odds", "extended_odds", "is_virtual",
    "sport_type", "gender", "margin", "created_at"
];

async function checkMatchesTable() {
    try {
        const columnsData = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'matches'
        `;
        const existingColumns = columnsData.map((c: any) => c.column_name);

        console.log("Existing columns:", existingColumns.join(", "));

        const missing = EXPECTED_COLUMNS.filter(col => !existingColumns.includes(col));

        if (missing.length > 0) {
            console.log("MISSING_COLUMNS:", missing.join(", "));
        } else {
            console.log("ALL_COLUMNS_EXIST");
        }

        const tablesData = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        const existingTables = tablesData.map((t: any) => t.table_name);
        const expectedTables = ["schools", "tournaments", "matches", "school_strengths"];
        const missingTables = expectedTables.filter(t => !existingTables.includes(t));

        if (missingTables.length > 0) {
            console.log("MISSING_TABLES:", missingTables.join(", "));
        } else {
            console.log("ALL_TABLES_EXIST");
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

checkMatchesTable();
