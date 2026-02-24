import { db } from "@/lib/db"
import { bets } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'virtual' or 'sports'
    const limit = parseInt(searchParams.get('limit') || '10')

    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    try {
        let userBets = await db.select()
            .from(bets)
            .where(eq(bets.userId, session.user.id))
            .orderBy(desc(bets.createdAt))
            .limit(limit || 20)

        // Filter by type if specified
        if (type === 'virtual') {
            userBets = userBets.filter(bet => {
                const selections = bet.selections as any[]
                return selections.some(s => s.matchId?.startsWith('vmt-') || s.matchId?.startsWith('vr-'))
            })
        } else if (type === 'sports') {
            userBets = userBets.filter(bet => {
                const selections = bet.selections as any[]
                return !selections.some(s => s.matchId?.startsWith('vmt-') || s.matchId?.startsWith('vr-'))
            })
        }

        return NextResponse.json({ success: true, bets: userBets })
    } catch (error) {
        console.error("Failed to fetch user bets:", error)
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
    }
}
