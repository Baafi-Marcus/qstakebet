import { db } from "@/lib/db"
import { tournaments, matches } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Trophy, MapPin, Activity, Calendar, ChevronRight } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function TournamentsPage() {
    const allTournaments = await db.select().from(tournaments).where(eq(tournaments.status, 'active')).orderBy(desc(tournaments.createdAt))

    // Grouping by sport
    const groupedTournaments = allTournaments.reduce((acc, t) => {
        const sport = t.sportType.toLowerCase()
        if (!acc[sport]) acc[sport] = []
        acc[sport].push(t)
        return acc
    }, {} as Record<string, typeof allTournaments>)

    const sportsList = Object.keys(groupedTournaments).sort()

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-12">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-2xl shadow-purple-500/10">
                        <Trophy className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Tournaments</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Explore all inter-school competitions</p>
                    </div>
                </div>

                {sportsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-slate-900/40 border border-white/5 rounded-[2.5rem] text-center space-y-4">
                        <Activity className="h-12 w-12 text-slate-700" />
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No active tournaments found</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {sportsList.map(sport => (
                            <div key={sport} className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                    <h2 className="text-sm font-black text-purple-400 uppercase tracking-[0.3em]">{sport}</h2>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {groupedTournaments[sport].map(tournament => (
                                        <Link
                                            key={tournament.id}
                                            href={`/competitions/${tournament.region.toLowerCase().replace(/\s+/g, '-')}`}
                                            className="group relative bg-slate-900/40 border border-white/5 hover:border-purple-500/30 p-6 rounded-[2rem] transition-all hover:bg-slate-800/60 overflow-hidden"
                                        >
                                            <div className="relative z-10 flex flex-col gap-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-black text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight leading-tight">
                                                            {tournament.name}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">
                                                            <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{tournament.region}</span>
                                                            <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{tournament.year}</span>
                                                            {tournament.level && <span className="text-purple-500/80">{tournament.level}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-white/5 rounded-2xl text-slate-500 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xl">
                                                        <ChevronRight className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Decorative Background Icon */}
                                            <Trophy className="absolute -bottom-4 -right-4 h-24 w-24 text-white/[0.02] group-hover:text-purple-500/[0.05] transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
