"use client"

import { useState } from "react"
import { Trophy, Users, Calendar, ArrowLeft, Wand2, Activity, CheckCircle2, Clock, List } from "lucide-react"
import Link from "next/link"
import { Tournament, School, Match } from "@/lib/types"
import { MatchResultModal } from "../../matches/MatchResultModal"
import { useRouter } from "next/navigation"
import { calculateGroupStandings } from "@/lib/match-utils"

export function TournamentDetailClient({
    tournament,
    schools,
    matches
}: {
    tournament: Tournament,
    schools: School[],
    matches: Match[]
}) {
    const router = useRouter()
    const [roster, setRoster] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const format = tournament.metadata?.format || 'league'
    const [activeTab, setActiveTab] = useState<'standings' | 'roster' | 'fixtures' | 'results'>(format === 'league' ? 'standings' : 'results')
    const [selectedMatchForResult, setSelectedMatchForResult] = useState<Match | null>(null)

    // Parse Groups from Metadata
    const groups = tournament.metadata?.groups || (format === 'league' ? ["Group A", "Group B", "Group C"] : [])

    // Differentiate matches
    const knockoutMatches = matches.filter(m =>
        m.group === 'Knockout' ||
        ['Quarter Final', 'Semi Final', 'Final'].includes(m.matchday || "") ||
        ['Quarter Final', 'Semi Final', 'Final'].includes(m.stage || "")
    )

    const groupMatches = matches.filter(m => !knockoutMatches.includes(m))

    // Define available tabs
    const availableTabs = format === 'league'
        ? ['standings', 'fixtures', 'results', 'roster']
        : ['fixtures', 'results', 'roster']

    return (
        <div className="space-y-8 pb-20">
            <Link href="/admin/tournaments" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                <ArrowLeft className="h-4 w-4" />
                Back to Tournaments
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">{tournament.name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-slate-400 text-sm">
                        <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-purple-500" /> {tournament.sportType}</span>
                        <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-purple-500" /> {tournament.gender}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-purple-500" /> {tournament.year}</span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-black rounded border border-purple-500/20 uppercase tracking-widest">{tournament.level}</span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded border border-blue-500/20 uppercase tracking-widest">{format}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-white/5 rounded-2xl w-fit">
                {availableTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-slate-500 hover:text-white'}`}
                    >
                        {tab === 'results' ? 'Result Center' : tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {activeTab === 'standings' && (
                    <div className="lg:col-span-12 space-y-12 animate-in fade-in slide-in-from-bottom-4">
                        {/* Group Standings */}
                        <div className="space-y-8">
                            {groups.map((group: string) => {
                                const standings = calculateGroupStandings(groupMatches, group)
                                if (standings.length === 0) return null
                                return (
                                    <div key={group} className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden">
                                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight">{group} Standings</h3>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Group Stage</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                                        <th className="px-6 py-4">Pos</th>
                                                        <th className="px-6 py-4">School</th>
                                                        <th className="px-6 py-4 text-center">P</th>
                                                        <th className="px-6 py-4 text-center">W</th>
                                                        <th className="px-6 py-4 text-center">D</th>
                                                        <th className="px-6 py-4 text-center">L</th>
                                                        <th className="px-6 py-4 text-center">GD</th>
                                                        <th className="px-6 py-4 text-center text-purple-400">Pts</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {standings.map((s, idx) => (
                                                        <tr key={s.schoolId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${idx < 2 ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-400'}`}>
                                                                    {idx + 1}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-white text-sm uppercase tracking-tight">{s.schoolName}</td>
                                                            <td className="px-6 py-4 text-center text-sm font-bold text-slate-300">{s.played}</td>
                                                            <td className="px-6 py-4 text-center text-sm font-bold text-green-500">{s.won}</td>
                                                            <td className="px-6 py-4 text-center text-sm font-bold text-slate-400">{s.drawn}</td>
                                                            <td className="px-6 py-4 text-center text-sm font-bold text-red-500">{s.lost}</td>
                                                            <td className="px-6 py-4 text-center text-sm font-bold text-slate-400">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                                                            <td className="px-6 py-4 text-center text-sm font-black text-purple-400">{s.points}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Knockout Bracket Section */}
                        {knockoutMatches.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Trophy className="h-6 w-6 text-yellow-500" />
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Knockout Stage</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {['Quarter Final', 'Semi Final', 'Final'].map(stage => {
                                        const stageMatches = knockoutMatches.filter(m => m.matchday === stage || m.stage === stage)
                                        if (stageMatches.length === 0) return null
                                        return (
                                            <div key={stage} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-4">
                                                <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-4">{stage}s</div>
                                                <div className="space-y-3">
                                                    {stageMatches.map(m => (
                                                        <div key={m.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-white">{m.participants[0].name}</span>
                                                                <span className="font-black text-purple-400">{m.participants[0].result ?? '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-bold text-white">{m.participants[1].name}</span>
                                                                <span className="font-black text-purple-400">{m.participants[1].result ?? '-'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {groups.every((g: string) => calculateGroupStandings(groupMatches, g).length === 0) && knockoutMatches.length === 0 && (
                            <div className="p-20 text-center border border-dashed border-white/10 rounded-3xl bg-slate-950/20">
                                <List className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                                <p className="text-slate-600 font-bold uppercase tracking-widest text-sm italic">No competition data available. Start by scheduling Group Stage or Knockout matches.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'roster' && (
                    <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 animate-in fade-in slide-in-from-left-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-500" />
                                Roster
                            </h2>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{schools.length} Schools</span>
                        </div>
                        <textarea
                            value={roster}
                            onChange={(e) => setRoster(e.target.value)}
                            placeholder="Add schools (one per line)..."
                            className="w-full h-48 bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono"
                        />
                        <button
                            onClick={() => {
                                setIsSaving(true)
                                setTimeout(() => setIsSaving(false), 500)
                            }}
                            className="w-full mt-4 py-4 bg-purple-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all active:scale-[0.98]"
                        >
                            {isSaving ? "Saving..." : "Update Roster"}
                        </button>
                        <div className="mt-8 space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Participating Entities</p>
                            <div className="grid grid-cols-1 gap-2">
                                {schools.map(s => (
                                    <div key={s.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-sm font-bold text-slate-300 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Trophy className="h-3 w-3 text-purple-500 font-bold" />
                                            {s.name}
                                        </div>
                                        {s.type !== 'school' && <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-slate-500 uppercase">{s.type}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'fixtures' && (
                    <div className="lg:col-span-12 bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 animate-in fade-in zoom-in-95">
                        <div className="max-w-md mx-auto text-center space-y-6 py-12">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                                <Wand2 className="h-10 w-10 text-purple-500 opacity-40" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Competition Engine</h3>
                                <p className="text-slate-500 text-sm font-medium">Use the &quot;Matches&quot; console to schedule fixtures for specific Groups or Knockout stages.</p>
                            </div>
                            <Link href="/admin/matches" className="block w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-white/5 hover:scale-[1.02] transition-all active:scale-95">
                                MANAGE ALL FIXTURES
                            </Link>
                        </div>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="lg:col-span-12 space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <Activity className="h-5 w-5 text-green-500" />
                                Match Result Center
                            </h2>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total: {matches.length} matches</span>
                        </div>

                        {matches.length > 0 ? matches.map(m => (
                            <div key={m.id} className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem] hover:bg-slate-800/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.status === 'finished' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {m.status === 'finished' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            {m.matchday && <span className="text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">{m.matchday}</span>}
                                            {m.group && m.group !== 'Knockout' && <span className="text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">{m.group}</span>}
                                            <span className="opacity-50">{m.stage}</span>
                                        </div>
                                        <div className="text-lg font-bold text-white mt-1 uppercase tracking-tight flex items-center gap-3">
                                            {m.participants[0].name}
                                            <span className="text-slate-600 font-black italic text-xs">VS</span>
                                            {m.participants[1].name}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Schedule</div>
                                        <div className="text-xs font-bold text-slate-400">{m.startTime}</div>
                                    </div>
                                    {m.status !== 'finished' && m.status !== 'settled' ? (
                                        <button
                                            onClick={() => setSelectedMatchForResult(m)}
                                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95"
                                        >
                                            Enter Result
                                        </button>
                                    ) : (
                                        <div className="px-6 py-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 px-8">
                                            <div className="text-center">
                                                <div className="text-[8px] font-black text-slate-500 uppercase">Score</div>
                                                <div className="text-sm font-black text-white">{m.participants[0].result} : {m.participants[1].result}</div>
                                            </div>
                                            <div className="w-px h-6 bg-white/10" />
                                            <div className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                                                Completed
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="p-20 text-center border border-dashed border-white/10 rounded-3xl bg-slate-950/20">
                                <p className="text-slate-600 font-bold uppercase tracking-widest text-xs italic">No matches scheduled for this tournament yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Result Modal */}
            {selectedMatchForResult && (
                <MatchResultModal
                    match={selectedMatchForResult}
                    onClose={() => setSelectedMatchForResult(null)}
                    onSuccess={() => {
                        router.refresh()
                        setSelectedMatchForResult(null)
                    }}
                />
            )}
        </div>
    )
}
