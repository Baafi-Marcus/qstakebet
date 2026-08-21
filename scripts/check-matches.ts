import { db } from "../lib/db";
import { matches } from "../lib/db/schema";
import { sql, asc } from "drizzle-orm";

async function run() {
    const allMatches = await db.select({
        id: matches.id,
        scheduledAt: matches.scheduledAt,
        status: matches.status,
    }).from(matches).orderBy(asc(matches.scheduledAt));

    console.log(allMatches);
    process.exit(0);
}
run();
