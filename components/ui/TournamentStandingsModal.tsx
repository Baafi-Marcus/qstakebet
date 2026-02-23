"use client"

import { useState } from "react"
import { X, Trophy, BarChart2, CalendarDays, ChevronRight } from "lucide-react"
import { Match } from "@/lib/types"
import { OddsButton } from "@/components/ui/OddsButton"

interface GroupStanding {
    schoolId: string
    schoolName: string
    played: number
    won: number
    drawn: number
    lost: number
    gf: number
    ga: number
    gd: number
    points: number
}

function calculateGroupStandings(matches: Match[], groupName: string): GroupStanding[] {
    const standings: Record<string, GroupStanding> = {}

    const groupMatches = matches.filter(m => m.group === groupName && (m.status === 'finished' || m.status === 'settled'))

    groupMatches.forEach(match => {
        if (match.participants.length < 2) return
        const p1 = match.participants[0]
        const p2 = match.participants[1]
        const s1 = typeof p1.result === 'number' ? p1.result : parseInt(String(p1.result || "0")) || 0
        const s2 = typeof p2.result === 'number' ? p2.result : parseInt(String(p2.result || "0")) || 0

            ;[p1, p2].forEach(p => {
                if (!standings[p.schoolId]) {
                    standings[p.schoolId] = {
                        schoolId: p.schoolId, schoolName: p.name,
                        played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0
                    }
                }
            })

        const st1 = standings[p1.schoolId]
        const st2 = standings[p2.schoolId]
        st1.played++; st2.played++
        st1.gf += s1; st1.ga += s2
        st2.gf += s2; st2.ga += s1

        if (s1 > s2) { st1.won++; st1.points += 3; st2.lost++ }
        else if (s2 > s1) { st2.won++; st2.points += 3; st1.lost++ }
        else { st1.drawn++; st1.points++; st2.drawn++; st2.points++ }
    })

    return Object.values(standings).map(s => ({ ...s, gd: s.gf - s.ga }))
        .sort((a, b) => b.points !== a.points ? b.points - a.points : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf)
}

interface Props {
    tournamentName: string
    tournamentId: string
    matches: Match[]
    groups: string[]
    groupAssignments: Record<string, string>
    allSchools?: Array<{ id: string, name: string }>
}

export function TournamentStandingsModal({ tournamentName, matches, groups, groupAssignments, allSchools }: Props) {
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState<"standings" | "fixtures">("standings")

    const upcomingMatches = matches.filter(m => m.status === 'upcoming' || m.status === 'live')
    const finishedMatches = matches.filter(m => m.status === 'finished' || m.status === 'settled')

    const hasGroupData = groups.length > 0

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded-lg hover:bg-purple-500/10"
            >
                <BarChart2 className="h-3.5 w-3.5" />
                Standings
            </button>

            {open && (
                <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

                    {/* Panel */}
                    <div className="relative w-full max-w-2xl bg-slate-950 border border-white/10 rounded-t-[2rem] md:rounded-[2rem] max-h-[85vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <Trophy className="h-4 w-4 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Tournament</p>
                                    <h2 className="text-base font-black text-white uppercase tracking-tight">{tournamentName}</h2>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/5 shrink-0">
                            {[{ id: "standings", label: "Standings", icon: BarChart2 }, { id: "fixtures", label: "Fixtures", icon: CalendarDays }].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-widest transition-all ${tab === t.id ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <t.icon className="h-3.5 w-3.5" />
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1 p-4 space-y-4">
                            {tab === "standings" && (
                                <>
                                    {hasGroupData ? groups.map(group => {
                                        const standings = calculateGroupStandings(matches, group)
                                        // Merge pre-assigned schools not yet in standings
                                        const assignedSchools = allSchools?.filter(s => groupAssignments[s.id] === group) || []
                                        const full = [...standings]
                                        assignedSchools.forEach(as => {
                                            if (!standings.find(s => s.schoolId === as.id)) {
                                                full.push({ schoolId: as.id, schoolName: as.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 })
                                            }
                                        })
                                        if (full.length === 0) return null
                                        return (
                                            <div key={group} className="rounded-2xl overflow-hidden border border-white/5">
                                                <div className="bg-white/5 px-4 py-3 flex items-center gap-2">
                                                    <span className="text-xs font-black text-white uppercase tracking-widest">{group}</span>
                                                    <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-500">Group Stage</span>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="border-b border-white/5 text-slate-500">
                                                                <th className="text-left px-4 py-2 font-black uppercase">#</th>
                                                                <th className="text-left px-4 py-2 font-black uppercase">Team</th>
                                                                <th className="px-2 py-2 font-black uppercase">P</th>
                                                                <th className="px-2 py-2 font-black uppercase">W</th>
                                                                <th className="px-2 py-2 font-black uppercase">D</th>
                                                                <th className="px-2 py-2 font-black uppercase">L</th>
                                                                <th className="px-2 py-2 font-black uppercase">GD</th>
                                                                <th className="px-2 py-2 font-black uppercase text-purple-400">Pts</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {full.map((s, idx) => (
                                                                <tr key={s.schoolId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                                    <td className="px-4 py-3">
                                                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black ${idx < 2 ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>{idx + 1}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 font-bold text-white">{s.schoolName}</td>
                                                                    <td className="px-2 py-3 text-center text-slate-400">{s.played}</td>
                                                                    <td className="px-2 py-3 text-center text-slate-400">{s.won}</td>
                                                                    <td className="px-2 py-3 text-center text-slate-400">{s.drawn}</td>
                                                                    <td className="px-2 py-3 text-center text-slate-400">{s.lost}</td>
                                                                    <td className="px-2 py-3 text-center text-slate-400">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                                                                    <td className="px-2 py-3 text-center font-black text-purple-400">{s.points}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <div className="text-center py-12 text-slate-500 font-bold uppercase text-xs tracking-widest">
                                            No group standings yet
                                        </div>
                                    )}
                                </>
                            )}

                            {tab === "fixtures" && (
                                <div className="space-y-3">
                                    {upcomingMatches.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Upcoming</p>
                                            <div className="space-y-2">
                                                {upcomingMatches.map(m => {
                                                    const label = m.participants.map(p => p.name).join(' vs ')
                                                    return (
                                                        <div key={m.id} className="bg-white/5 rounded-2xl p-3 border border-white/5 space-y-3">
                                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                                <span>{m.group || m.stage}</span>
                                                                <span className={m.status === 'live' ? 'text-red-400 animate-pulse' : ''}>{m.status === 'live' ? '🔴 LIVE' : m.startTime || 'TBD'}</span>
                                                            </div>
                                                            <div className={`grid gap-2 ${m.participants.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                                                {m.participants.map(p => (
                                                                    <OddsButton key={p.schoolId} label={p.name} odds={p.odd} matchId={m.id} matchLabel={label} marketName="Match Winner" showLabel={true} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {finishedMatches.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Results</p>
                                            <div className="space-y-2">
                                                {finishedMatches.map(m => (
                                                    <div key={m.id} className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                                                            <span>{m.participants[0]?.name}</span>
                                                            <span className="text-slate-400 font-mono text-xs px-2 py-0.5 bg-white/10 rounded">
                                                                {m.participants[0]?.result ?? '-'} – {m.participants[1]?.result ?? '-'}
                                                            </span>
                                                            <span>{m.participants[1]?.name}</span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-600 font-black uppercase">{m.group || m.stage}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {upcomingMatches.length === 0 && finishedMatches.length === 0 && (
                                        <div className="text-center py-12 text-slate-500 font-bold uppercase text-xs tracking-widest">No fixtures yet</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
