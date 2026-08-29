"use client"

import { useState } from "react"
import { XMarkIcon as X, TrophyIcon as Trophy, CalendarDaysIcon as CalendarDays, ClockIcon as Clock, CheckCircleIcon as CheckCircle2 } from "@heroicons/react/24/solid";
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
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary transition-standard px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10"
            >
                <CalendarDays className="h-3.5 w-3.5" />
                Fixtures
            </button>

            {open && (
                <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />

                    <div className="relative w-full max-w-2xl bg-popover border border-border rounded-t-[2.5rem] md:rounded-[2.5rem] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="p-6 border-b border-border/50 bg-card/40 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                                    <Trophy className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Match Center</p>
                                    <h2 className="text-base font-black text-foreground uppercase tracking-tight">{tournamentName}</h2>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-2.5 rounded-xl bg-accent hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-card/40 border-b border-border/50 shrink-0 px-2">
                            {[
                                { id: "fixtures", label: "Upcoming", icon: Clock },
                                { id: "results", label: "Results", icon: CheckCircle2 }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <t.icon className="h-3.5 w-3.5" />
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-8 bg-popover/50">
                            {groupKeys.length > 0 ? groupKeys.map(key => (
                                <div key={key} className="space-y-3">
                                    <div className="flex items-center gap-3 px-1">
                                        <div className="h-px flex-1 bg-border" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{key}</span>
                                        <div className="h-px flex-1 bg-border" />
                                    </div>
                                    <div className="space-y-3">
                                        {groupedMatches[key].map(m => {
                                            const matchLabel = m.participants.map(p => p.name).join(' vs ')
                                            return (
                                                <div key={m.id} className="bg-card/40 border border-border/50 rounded-2xl p-4 space-y-4">
                                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                        <span className="flex items-center gap-2">
                                                            {m.status === 'live' && <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                                                            {m.status === 'live' ? 'LIVE' : m.startTime || 'TBD'}
                                                        </span>
                                                        <span>{m.matchday}</span>
                                                    </div>

                                                    {activeTab === "results" ? (
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex-1 flex items-center justify-between bg-muted rounded-xl px-4 py-3 border border-border/50">
                                                                <span className="text-sm font-bold text-foreground uppercase">{m.participants[0].name}</span>
                                                                <span className="text-lg font-black text-primary">{m.participants[0].result ?? '-'}</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-muted-foreground/50 italic">VS</span>
                                                            <div className="flex-1 flex items-center justify-between bg-muted rounded-xl px-4 py-3 border border-border/50">
                                                                <span className="text-sm font-black text-primary">{m.participants[1].result ?? '-'}</span>
                                                                <span className="text-sm font-bold text-foreground uppercase">{m.participants[1].name}</span>
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
                                    <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4 opacity-20" />
                                    <p className="text-muted-foreground/70 font-bold uppercase text-xs tracking-widest">No {activeTab} available yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
