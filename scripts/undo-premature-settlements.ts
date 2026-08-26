/**
 * Un-settle one-eighth matches that were settled from incomplete (<5 round) coverage.
 * Reverses: lineup pointsBreakdown entries, pointsEarned, users.totalFantasyPoints.
 * Restores match to live running state keeping the partial round scores for display.
 *
 * Usage: npx tsx scripts/undo-premature-settlements.ts [--commit]
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");

async function main() {
    console.log("Connecting...");
    const { db } = await import("../lib/db");
    const { matches, fantasyLineups, users } = await import("../lib/db/schema");
    const { eq, sql } = await import("drizzle-orm");

    const allMatches = await db.select().from(matches).where(eq(matches.status, "settled"));
    const bad = allMatches.filter(m => {
        const stage = (m.stage || "").toLowerCase();
        const rounds = ((m.result as any)?.rounds as any[] | undefined)?.length ?? 0;
        return stage.includes("eighth") && rounds > 0 && rounds < 5;
    });

    console.log(`Found ${bad.length} prematurely settled one-eighth matches\n`);
    let totalDeltaReversed = 0;

    for (const m of bad) {
        const result = m.result as any;
        const rounds = result?.rounds || [];
        const gameWeek = `Matchday ${m.scheduledAt!.toISOString().slice(0, 10)}`;
        console.log(`--- ${m.id.slice(0, 12)} | ${(m.participants as any[]).map(p => p.name).join(" vs ")}`);
        console.log(`    gameWeek=${gameWeek} rounds=${rounds.length}`);

        const lineups = await db.select().from(fantasyLineups).where(eq(fantasyLineups.gameWeek, gameWeek));
        for (const lu of lineups) {
            const breakdown = (lu.pointsBreakdown as Record<string, any>) || {};
            if (!breakdown[m.id]) continue;

            let sum = 0;
            for (const v of Object.values(breakdown[m.id] as Record<string, any>)) {
                if (typeof v === "number") sum += v;
                else if (v && typeof v === "object") sum += Number((v as any).total) || 0;
            }

            const nextBreakdown = { ...breakdown };
            delete nextBreakdown[m.id];
            const newTotal = (lu.pointsEarned || 0) - sum;
            const nextStatus = Object.keys(nextBreakdown).length > 0 ? "settled" : "active";

            console.log(`    lineup ${lu.id.slice(0, 12)} user=${lu.userId.slice(0, 12)}: -${sum} pts (${lu.pointsEarned} -> ${newTotal}, status -> ${nextStatus})`);

            if (COMMIT) {
                await db.update(fantasyLineups)
                    .set({ pointsBreakdown: nextBreakdown, pointsEarned: newTotal, status: nextStatus, updatedAt: new Date() })
                    .where(eq(fantasyLineups.id, lu.id));
                if (sum !== 0) {
                    await db.update(users)
                        .set({ totalFantasyPoints: sql`${users.totalFantasyPoints} - ${sum}` })
                        .where(eq(users.id, lu.userId));
                }
            }
            totalDeltaReversed += sum;
        }

        console.log(`    match -> live running state (R${rounds.length})`);

        if (COMMIT) {
            await db.update(matches)
                .set({
                    result: { scores: result.scores, rounds },
                    participants: ((m.participants as any[]) || []),
                    status: "live",
                    isLive: true,
                    currentRound: rounds.length,
                })
                .where(eq(matches.id, m.id));
        }
    }

    console.log(`\nTotal fantasy points to reverse: ${totalDeltaReversed}`);
    console.log(COMMIT ? "COMMITTED" : "DRY RUN (pass --commit to apply)");
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
