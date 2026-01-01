import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const url = process.env.DATABASE_URL;
const sql = neon(url);

const SEED_SCHOOL_DATA = {
    "Ahafo": [
        { "name": "Acherensua Senior High", "type": "Senior High School", "district": "Asutifi South" },
        { "name": "OLA Girls Senior High, Kenyasi", "type": "Senior High School", "district": "Asutifi North" }
    ],
    "Ashanti": [
        { "name": "Adventist Senior High, Kumasi", "type": "Senior High School", "district": "Kumasi" },
        { "name": "Prempeh College", "type": "Senior High School", "district": "Kumasi" }
    ],
    "Greater Accra": [
        { "name": "Accra Academy", "type": "Senior High School", "district": "Accra" },
        { "name": "Achimota Senior High", "type": "Senior High School", "district": "Okaikwei North" },
        { "name": "PRESEC Legon", "type": "Senior High School", "district": "Accra" }
    ]
    // ... adding just a few for testing
};

async function main() {
    console.log("🌱 Diagnostic Seeding...");
    try {
        for (const [region, schoolList] of Object.entries(SEED_SCHOOL_DATA)) {
            for (const school of schoolList) {
                const schoolId = school.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                await sql`
                    INSERT INTO schools (id, name, region, district, category)
                    VALUES (${schoolId}, ${school.name}, ${region}, ${school.district}, ${school.type})
                    ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    region = EXCLUDED.region,
                    district = EXCLUDED.district,
                    category = EXCLUDED.category
                `;
            }
        }
        console.log("✅ Diagnostic Seeding complete!");
    } catch (err) {
        console.error("❌ Diagnostic Seeding failed:", err);
    }
}

main();
