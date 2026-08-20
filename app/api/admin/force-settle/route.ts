import { NextResponse } from "next/server";
import { settleFantasyLineups } from "@/lib/settlement";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const matchId = searchParams.get('matchId');
        
        if (!matchId) return NextResponse.json({ error: "Missing matchId" }, { status: 400 });

        const customScores: Record<string, number> = {};
        
        // Define scores based on matchId
        if (matchId === 'nsmq-2026-m1') {
            const mData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
            if (mData.length > 0) {
                const participants = mData[0].participants as any[];
                for (const p of participants) {
                    if (p.name.includes("Edinaman")) customScores[p.schoolId] = 47;
                    if (p.name.includes("Abomosu")) customScores[p.schoolId] = 35;
                    if (p.name.includes("Wa SHS")) customScores[p.schoolId] = 11;
                }
            }
        } else if (matchId === 'nsmq-2026-m2') {
            const mData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
            if (mData.length > 0) {
                const participants = mData[0].participants as any[];
                for (const p of participants) {
                    if (p.name.includes("Hubert")) customScores[p.schoolId] = 51;
                    if (p.name.includes("Bright")) customScores[p.schoolId] = 48;
                    if (p.name.includes("Akwamuman")) customScores[p.schoolId] = 29;
                }
            }
        } else {
            return NextResponse.json({ error: "Unknown matchId" }, { status: 400 });
        }

        if (Object.keys(customScores).length === 0) {
            return NextResponse.json({ error: "Failed to map scores" }, { status: 500 });
        }

        // Save scores to match result
        const m = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
        const existingResult = (m[0].result as any) || {};
        await db.update(matches)
            .set({ result: { ...existingResult, scores: customScores } })
            .where(eq(matches.id, matchId));

        // Settle points
        const res = await settleFantasyLineups(matchId, { customScores });
        
        return NextResponse.json({ success: true, customScores, res });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
