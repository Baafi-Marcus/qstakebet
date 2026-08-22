import "dotenv/config"
import { db } from "../lib/db"
import { matches } from "../lib/db/schema"
import { eq } from "drizzle-orm"

async function main() {
    const rows = await db.select().from(matches).where(eq(matches.tournamentId, "nsmq-2026"))
    const sorted = rows.sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime())
    for (const m of sorted.slice(0, 21)) {
        const res = (m.result as any) || {}
        const parts = ((m.participants as any[]) || []).map((p: any) => `${p.name}=${p.schoolId}`).join(" | ")
        console.log(`${m.id} [${m.status}] ${m.scheduledAt?.toISOString().slice(0, 10)}\n   ${parts}\n   scores: ${JSON.stringify(res.scores || null)} winner: ${res.winner ?? "-"} rounds: ${Array.isArray(res.rounds) ? res.rounds.length : 0}`)
    }
    process.exit(0)
}
main()
