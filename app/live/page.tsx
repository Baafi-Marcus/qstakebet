import { getAllMatches } from "@/lib/data"
import { HomeClient } from "@/components/home/HomeClient"
import { Timer } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function LivePage() {
    const allMatches = await getAllMatches()

    // Filter for Today only
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayMatches = allMatches.filter(m => {
        if (!m.scheduledAt) return m.isLive // If no schedule but live, show it
        const sched = new Date(m.scheduledAt)
        return sched >= today && sched < tomorrow
    })

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 pb-20">
                <div className="max-w-[1400px] mx-auto px-4 pt-8 underline-offset-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-purple-500/10 rounded-xl">
                            <Timer className="h-6 w-6 text-purple-400 animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Live & Today&apos;s Matches</h1>
                    </div>
                </div>
                <HomeClient initialMatches={todayMatches} />
            </main>
        </div>
    )
}
