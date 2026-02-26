import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { matches, tournaments, matchHistory, bets } from "@/lib/db/schema";
import { revalidateTag } from "next/cache";

export async function GET() {
    try {
        await db.delete(bets);
        await db.delete(matchHistory);
        await db.delete(matches);
        await db.delete(tournaments);

        revalidateTag("matches");
        revalidateTag("tournaments");

        return NextResponse.json({ success: true, message: "Successfully wiped matches and tournaments." });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
