import { getAllBets } from "@/lib/admin-analytics-actions"
import { BetsClient } from "./BetsClient"

export const dynamic = 'force-dynamic'

export default async function AdminBetsPage() {
    const result = await getAllBets()

    if (!result.success || !result.bets) {
        return (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
                <p className="text-red-400 font-bold">{result.error || "Failed to load platform bets"}</p>
            </div>
        )
    }

    return <BetsClient initialBets={result.bets} />
}
