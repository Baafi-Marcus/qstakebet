import { db } from "../lib/db";
import { schools } from "../lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

const universities = [
    { name: "University of Ghana (UG)", region: "Greater Accra" },
    { name: "Kwame Nkrumah University of Science and Technology (KNUST)", region: "Ashanti" },
    { name: "University of Cape Coast (UCC)", region: "Central" },
    { name: "University for Development Studies (UDS)", region: "Northern" },
    { name: "University of Education, Winneba (UEW)", region: "Central" },
    { name: "University of Professional Studies, Accra (UPSA)", region: "Greater Accra" },
    { name: "University of Mines and Technology (UMaT)", region: "Western" },
    { name: "University of Health and Allied Sciences (UHAS)", region: "Volta" },
    { name: "University of Energy and Natural Resources (UENR)", region: "Bono" },
    { name: "C.K. Tedam University of Technology and Applied Sciences (CKT-UTAS)", region: "Upper East" },
    { name: "Ashesi University", region: "Eastern" },
    { name: "All Nations University", region: "Eastern" },
    { name: "Accra Technical University", region: "Greater Accra" },
    { name: "Academic City University College", region: "Greater Accra" },
    { name: "Accra Institute of Technology (AIT)", region: "Greater Accra" },
    { name: "Valley View University", region: "Greater Accra" }, // User said Eastern / Greater Accra
    { name: "Anglican University College of Technology", region: "Ashanti" },
    { name: "University of Skills Training & Entrepreneurial Development (USTED)", region: "Ashanti" },
    { name: "BlueCrest College", region: "Greater Accra" },
    { name: "Catholic Institute of Business and Technology", region: "Greater Accra" }
];

async function seed() {
    console.log("🌱 Seeding Universities...");

    for (const uni of universities) {
        // Check if exists
        const existing = await db.select().from(schools)
            .where(and(
                eq(schools.region, uni.region),
                sql`lower(${schools.name}) = lower(${uni.name})`
            ))
            .limit(1);

        if (existing.length > 0) {
            console.log(`- Skipping ${uni.name} (exists)`);
            continue;
        }

        const id = `uni-${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(schools).values({
            id,
            name: uni.name,
            region: uni.region,
            level: "university",
            type: "school", // Primary institution
        });
        console.log(`+ Created ${uni.name}`);
    }

    console.log("✅ Seeding complete!");
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
