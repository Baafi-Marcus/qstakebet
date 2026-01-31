import { db } from "@/lib/db"
import { bets } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    try {
        const userBets = await db.select()
            .from(bets)
            .where(eq(bets.userId, session.user.id))
            .orderBy(desc(bets.createdAt))
            .limit(10)

        return NextResponse.json({ success: true, bets: userBets })
    } catch (error) {
        console.error("Failed to fetch user bets:", error)
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
    }
}
