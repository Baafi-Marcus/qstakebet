"use client"

import { useState } from "react"
import { MagnifyingGlassIcon as Search, ArchiveBoxIcon as History, TrophyIcon as Trophy, CalendarIcon as Calendar } from "@heroicons/react/24/solid";
import { Match, Tournament, School } from "@/lib/types"

export function LogClient({
    initialMatches,
    tournaments,
    schools
}: {
    initialMatches: Match[],
    tournaments: Tournament[],
    schools: School[]
}) {
    const [searchQuery, setSearchQuery] = useState("")

    const getTournamentName = (id: string | null | undefined) => {
        if (!id) return "Unknown Tournament"
        return tournaments.find(t => t.id === id)?.name || "Unknown Tournament"
    }

    const filteredMatches = initialMatches.filter(m => {
        const tName = getTournamentName(m.tournamentId).toLowerCase()
        const pNames = m.participants.map(p => p.name.toLowerCase()).join(" ")
        const query = searchQuery.toLowerCase()
        return tName.includes(query) || pNames.includes(query) || m.stage.toLowerCase().includes(query)
    })

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Event History Log</h1>
                <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest font-bold">Comprehensive record of all completed matches</p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 bg-card/60 p-4 rounded-3xl border border-border/50">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search historical records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background/50 border border-input rounded-2xl py-3 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>
            </div>

            {/* Match List */}
            <div className="grid grid-cols-1 gap-4 pb-10">
                {filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => {
                        const results = match.result as any
                        const winnerId = results?.winner

                        return (
                            <div key={match.id} className="bg-card/40 border border-border/50 p-6 rounded-[2rem] hover:border-border hover:bg-muted/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-8 group">
                                <div className="flex items-start gap-5">
                                    <div className="p-4 rounded-2xl bg-muted/50 text-muted-foreground group-hover:bg-purple-600/10 group-hover:text-purple-400 transition-colors">
                                        <History className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{getTournamentName(match.tournamentId)}</h3>
                                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-widest">{match.stage}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 mt-2">
                                            {match.participants.map((p, i) => (
                                                <div key={p.schoolId} className="flex items-center gap-2">
                                                    {i > 0 && <span className="text-muted-foreground/50 font-bold mx-2">VS</span>}
                                                    <span className={`text-sm font-bold ${p.schoolId === winnerId ? 'text-green-400' : 'text-muted-foreground'}`}>
                                                        {p.name}
                                                    </span>
                                                    {results?.scores && (
                                                        <span className="bg-background/50 px-2 py-1 rounded-lg text-xs font-mono text-foreground">
                                                            {results.scores[p.schoolId] ?? 0}
                                                        </span>
                                                    )}
                                                    {p.schoolId === winnerId && <Trophy className="h-3 w-3 text-yellow-500" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right border-t border-border/50 pt-4 lg:border-0 lg:pt-0">
                                    <div className="flex items-center gap-2 justify-end text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">
                                        <Calendar className="h-3 w-3" />
                                        Completed on {match.startTime}
                                    </div>
                                    <div className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-tighter">Event ID: {match.id}</div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="py-20 text-center bg-card/20 rounded-3xl border border-dashed border-border/50">
                        <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground font-medium uppercase tracking-wide text-sm">No historical records found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
