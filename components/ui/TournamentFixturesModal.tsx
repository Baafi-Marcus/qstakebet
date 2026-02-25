"use client"

import { useState } from "react"
import { X, Trophy, CalendarDays, Clock, CheckCircle2 } from "lucide-react"
import { Match } from "@/lib/types"
import { OddsButton } from "@/components/ui/OddsButton"

interface Props {
    tournamentName: string
    tournamentId: string
    matches: Match[]
}

export function TournamentFixturesModal({ tournamentName, matches }: Props) {
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<"fixtures" | "results">("fixtures")

    const fixtures = matches.filter(m => m.status === 'upcoming' || m.status === 'live')
    const results = matches.filter(m => m.status === 'finished' || m.status === 'settled')

    const currentMatches = activeTab === "fixtures" ? fixtures : results

    // Group matches by Stage or Group
    const groupedMatches = currentMatches.reduce((acc, m) => {
        const key = m.group || m.stage || "Tournament"
        if (!acc[key]) acc[key] = []
        acc[key].push(m)
        return acc
    }, {} as Record<string, Match[]>)

    const groupKeys = Object.keys(groupedMatches).sort()

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors px-3 py-1.5 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 active:scale-95"
            >
                <CalendarDays className="h-3.5 w-3.5" />
                Fixtures
            </button>

            {open && (
                <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />

                    <div className="relative w-full max-w-2xl bg-slate-950 border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 bg-slate-900/40 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                                    <Trophy className="h-4 w-4 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Match Center</p>
                                    <h2 className="text-base font-black text-white uppercase tracking-tight">{tournamentName}</h2>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-900/40 border-b border-white/5 shrink-0 px-2">
                            {[
                                { id: "fixtures", label: "Upcoming", icon: Clock },
                                { id: "results", label: "Results", icon: CheckCircle2 }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <t.icon className="h-3.5 w-3.5" />
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-8 bg-slate-950/50">
                            {groupKeys.length > 0 ? groupKeys.map(key => (
                                <div key={key} className="space-y-3">
                                    <div className="flex items-center gap-3 px-1">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{key}</span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    <div className="space-y-3">
                                        {groupedMatches[key].map(m => {
                                            const matchLabel = m.participants.map(p => p.name).join(' vs ')
                                            return (
                                                <div key={m.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-4">
                                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                        <span className="flex items-center gap-2">
                                                            {m.status === 'live' && <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                                                            {m.status === 'live' ? 'LIVE' : m.startTime || 'TBD'}
                                                        </span>
                                                        <span>{m.matchday}</span>
                                                    </div>

                                                    {activeTab === "results" ? (
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex-1 flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                                                                <span className="text-sm font-bold text-white uppercase">{m.participants[0].name}</span>
                                                                <span className="text-lg font-black text-purple-400">{m.participants[0].result ?? '-'}</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-700 italic">VS</span>
                                                            <div className="flex-1 flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                                                                <span className="text-sm font-black text-purple-400">{m.participants[1].result ?? '-'}</span>
                                                                <span className="text-sm font-bold text-white uppercase">{m.participants[1].name}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`grid gap-2 ${m.participants.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                                            {m.participants.map(p => (
                                                                <OddsButton key={p.schoolId} label={p.name} odds={p.odd} matchId={m.id} matchLabel={matchLabel} marketName="Match Winner" showLabel={true} tournamentName={tournamentName} stage={m.stage} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-24">
                                    <Clock className="h-12 w-12 text-slate-800 mx-auto mb-4 opacity-20" />
                                    <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">No {activeTab} available yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
