import { db } from "../lib/db";
import { schools, tournaments, matches } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function fetchIds() {
    try {
        console.log("--- SCHOOLS ---");
        const allSchools = await db.select({
            id: schools.id,
            name: schools.name,
            level: schools.level
        }).from(schools).limit(10);
        console.log(JSON.stringify(allSchools, null, 2));

        console.log("\n--- TOURNAMENTS ---");
        const allTournaments = await db.select({
            id: tournaments.id,
            name: tournaments.name,
            level: tournaments.level,
            sportType: tournaments.sportType
        }).from(tournaments).limit(5);
        console.log(JSON.stringify(allTournaments, null, 2));

        console.log("\n--- CURRENT MATCHES ---");
        const allMatches = await db.select({
            id: matches.id,
            participants: matches.participants,
            status: matches.status,
            startTime: matches.startTime
        }).from(matches).limit(5);
        console.log(JSON.stringify(allMatches, null, 2));

    } catch (err) {
        console.error("Error fetching IDs:", err);
    }
    process.exit(0);
}

fetchIds();
