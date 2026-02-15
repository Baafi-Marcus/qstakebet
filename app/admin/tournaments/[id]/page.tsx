"use client"

import { useState, useEffect, use } from "react"
import { Trophy, Users, Calendar, ArrowLeft, Wand2, Activity, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { Tournament, School, Match } from "@/lib/types"
import { MatchResultModal } from "../../matches/MatchResultModal"
import { useRouter } from "next/navigation"

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [schools, setSchools] = useState<School[]>([])
    const [matches, setMatches] = useState<Match[]>([])
    const [roster, setRoster] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'roster' | 'fixtures' | 'results'>('results')
    const [selectedMatchForResult, setSelectedMatchForResult] = useState<Match | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            setTournament({
                id,
                name: "Ashanti Inter-Schools 2026",
                region: "Ashanti",
                sportType: "football",
                gender: "male",
                year: "2026",
                level: "shs",
                status: "active"
            })
            setSchools([
                { id: "s1", name: "Prempeh College", region: "Ashanti", level: "shs" },
                { id: "s2", name: "Opoku Ware School", region: "Ashanti", level: "shs" },
            ])
            // Mock matches for this tournament
            setMatches([
                {
                    id: "m1",
                    tournamentId: id,
                    participants: [
                        { schoolId: "s1", name: "Prempeh College", odd: 1.85, result: null },
                        { schoolId: "s2", name: "Opoku Ware School", odd: 1.95, result: null }
                    ],
                    startTime: "02:00 PM",
                    scheduledAt: new Date(),
                    status: "upcoming",
                    isLive: false,
                    isVirtual: false,
                    stage: "Finals",
                    odds: { "s1": 1.85, "s2": 1.95 },
                    sportType: "football",
                    gender: "male",
                    margin: 0.1,
                    result: null
                }
            ])
        }, 100)
        return () => clearTimeout(timer)
    }, [id])

    if (!tournament) {
        return <div className="p-8 text-white font-bold uppercase tracking-tighter">Loading...</div>
    }

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
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-white/5 rounded-2xl w-fit">
                {['roster', 'fixtures', 'results'].map((tab) => (
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
                {activeTab === 'roster' && (
                    <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 animate-in fade-in slide-in-from-left-4">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            Roster
                        </h2>
                        <textarea
                            value={roster}
                            onChange={(e) => setRoster(e.target.value)}
                            placeholder="Schools..."
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
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Participating Schools</p>
                            {schools.map(s => (
                                <div key={s.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-sm font-bold text-slate-300 flex items-center gap-3">
                                    <Trophy className="h-3 w-3 text-purple-500" />
                                    {s.name}
                                </div>
                            ))}
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
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Fixture Engine</h3>
                                <p className="text-slate-500 text-sm font-medium">Generate randomized brackets or group stages for this tournament based on the current roster.</p>
                            </div>
                            <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-white/5 hover:scale-[1.02] transition-all active:scale-95">
                                GENERATE COMPETITION
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="lg:col-span-12 space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <Activity className="h-5 w-5 text-green-500" />
                                Live & Recent Matches
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
                                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{m.stage}</div>
                                        <div className="text-lg font-bold text-white mt-1">
                                            {m.participants[0].name} <span className="text-slate-600 px-2 font-black">VS</span> {m.participants[1].name}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Schedule</div>
                                        <div className="text-xs font-bold text-slate-400">{m.startTime}</div>
                                    </div>
                                    {m.status !== 'finished' ? (
                                        <button
                                            onClick={() => setSelectedMatchForResult(m)}
                                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95"
                                        >
                                            Enter Result
                                        </button>
                                    ) : (
                                        <div className="px-6 py-3 bg-white/5 border border-white/5 text-slate-500 text-[10px] font-black rounded-xl uppercase tracking-widest">
                                            Completed
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
