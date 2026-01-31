import "dotenv/config";
import { db } from "../lib/db";
import { matches } from "../lib/db/schema";

async function drizzleAudit() {
    try {
        console.log("DRIZZLE_AUDIT_START");
        // Try to select just one column to narrow it down
        console.log("Testing tournament_id...");
        await db.select({ id: matches.id, tid: matches.tournamentId }).from(matches).limit(1);
        console.log("tournament_id: SUCCESS");

        console.log("Testing full select...");
        await db.select().from(matches).limit(1);
        console.log("full_select: SUCCESS");

        console.log("DRIZZLE_AUDIT_END");
    } catch (err: any) {
        console.error("DRIZZLE_AUDIT_ERROR:", err.message);
        if (err.detail) console.error("DETAIL:", err.detail);
    }
}
drizzleAudit();
