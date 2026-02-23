import { db } from "@/lib/db"
import { tournaments } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { notFound } from "next/navigation"
import { Trophy, MapPin, Calendar, ChevronRight, Activity } from "lucide-react"
import Link from "next/link"

type Props = {
    params: Promise<{ sport: string }>
}

export const dynamic = 'force-dynamic'

const VALID_SPORTS = ["football", "basketball", "athletics", "volleyball", "handball", "quiz"]

export default async function SportPage({ params }: Props) {
    const { sport } = await params
    const sportKey = sport.toLowerCase()

    if (!VALID_SPORTS.includes(sportKey)) {
        notFound()
    }

    const title = sport.charAt(0).toUpperCase() + sport.slice(1)

    const sportTournaments = await db.select()
        .from(tournaments)
        .where(
            and(
                eq(tournaments.status, 'active'),
                eq(tournaments.sportType, sportKey)
            )
        )
        .orderBy(desc(tournaments.createdAt))

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-2xl shadow-purple-500/10">
                        <Trophy className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{title} Tournaments</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Place your bets on the best {title.toLowerCase()} action</p>
                    </div>
                </div>

                {sportTournaments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-white/5 rounded-[2.5rem] text-center space-y-6">
                        <div className="inline-flex p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                            <Activity className="h-10 w-10 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">No Active {title} Tournaments</h2>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Check back soon</p>
                        </div>
                        <p className="max-w-xs mx-auto text-slate-400 text-sm font-medium">
                            We are currently setting up new competitions for {title.toLowerCase()}. Stay tuned for live odds and fixtures!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {sportTournaments.map(tournament => (
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
                                <Trophy className="absolute -bottom-4 -right-4 h-24 w-24 text-white/[0.02] group-hover:text-purple-500/[0.05] transition-colors" />
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
