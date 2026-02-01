"use client"

import { useState } from "react"
import { Search, Trophy, Calendar, Filter, Brain, Zap, Target, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { Match } from "@/lib/types"

interface ResultsClientProps {
    initialMatches: Match[]
}

export function ResultsClient({ initialMatches }: ResultsClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedSport, setSelectedSport] = useState<string>("all")
    const [expandedMatch, setExpandedMatch] = useState<string | null>(null)

    const filteredMatches = initialMatches.filter(m => {
        const matchesQuery = m.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            m.tournamentName?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesSport = selectedSport === "all" || m.sportType === selectedSport
        return matchesQuery && matchesSport
    })

    const sports = ["all", "football", "basketball", "volleyball", "handball", "athletics", "quiz"]

    const renderScoreDetail = (match: Match) => {
        const result = match.result as any
        const meta = result?.metadata
        if (!meta) return null

        if (match.sportType === "football" || match.sportType === "handball") {
            const details = meta.footballDetails
            if (!details) return null
            return (
                <div className="grid grid-cols-2 gap-8 mt-4 p-6 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                    {match.participants.map(p => (
                        <div key={p.schoolId} className="space-y-2">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.name}</div>
                            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl">
                                <span className="text-xs text-slate-400">Half Time</span>
                                <span className="font-bold text-white">{details[p.schoolId]?.ht}</span>
                            </div>
                            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-primary/20">
                                <span className="text-xs text-primary font-bold">Full Time</span>
                                <span className="font-black text-white text-lg">{details[p.schoolId]?.ft}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )
        }

        if (match.sportType === "basketball") {
            const details = meta.basketballDetails
            if (!details) return null
            return (
                <div className="mt-4 p-6 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto animate-in fade-in slide-in-from-top-2">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                <th className="pb-3">Team</th>
                                <th className="pb-3 text-center">Q1</th>
                                <th className="pb-3 text-center">Q2</th>
                                <th className="pb-3 text-center">Q3</th>
                                <th className="pb-3 text-center">Q4</th>
                                <th className="pb-3 text-right text-primary">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {match.participants.map(p => (
                                <tr key={p.schoolId} className="group">
                                    <td className="py-4 font-bold text-white uppercase text-xs">{p.name}</td>
                                    <td className="py-4 text-center text-slate-400">{details[p.schoolId]?.q1}</td>
                                    <td className="py-4 text-center text-slate-400">{details[p.schoolId]?.q2}</td>
                                    <td className="py-4 text-center text-slate-400">{details[p.schoolId]?.q3}</td>
                                    <td className="py-4 text-center text-slate-400">{details[p.schoolId]?.q4}</td>
                                    <td className="py-4 text-right font-black text-white">{result.scores?.[p.schoolId]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        }

        if (match.sportType === "volleyball") {
            const details = meta.volleyballDetails
            if (!details) return null
            return (
                <div className="mt-4 p-6 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-8">
                        {match.participants.map(p => (
                            <div key={p.schoolId} className="space-y-3">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">{p.name}</div>
                                <div className="flex gap-2">
                                    {['s1', 's2', 's3'].map(s => (
                                        <div key={s} className="flex-1 text-center bg-black/40 p-2 rounded-lg">
                                            <div className="text-[8px] text-slate-600 mb-1 uppercase">Set {s[1]}</div>
                                            <div className="font-bold text-white text-sm">{details[p.schoolId]?.[s]}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[10px] font-black text-primary uppercase">Total Sets Win</span>
                                    <span className="text-xl font-black text-white">{result.scores?.[p.schoolId]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

        if (match.sportType === "quiz") {
            const details = meta.quizDetails
            if (!details) return null
            return (
                <div className="mt-4 p-6 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto animate-in fade-in slide-in-from-top-2">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                <th className="pb-3 px-2">School</th>
                                <th className="pb-3 px-2 text-center">R1</th>
                                <th className="pb-3 px-2 text-center">R2</th>
                                <th className="pb-3 px-2 text-center">R3</th>
                                <th className="pb-3 px-2 text-center">R4</th>
                                <th className="pb-3 px-2 text-center">R5</th>
                                <th className="pb-3 px-2 text-right text-primary">Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {match.participants.map(p => (
                                <tr key={p.schoolId}>
                                    <td className="py-4 px-2 font-bold text-white uppercase text-xs truncate max-w-[150px]">{p.name}</td>
                                    <td className="py-4 px-2 text-center text-slate-400">{details[p.schoolId]?.r1}</td>
                                    <td className="py-4 px-2 text-center text-slate-400">{details[p.schoolId]?.r2}</td>
                                    <td className="py-4 px-2 text-center text-slate-400">{details[p.schoolId]?.r3}</td>
                                    <td className="py-4 px-2 text-center text-slate-400">{details[p.schoolId]?.r4}</td>
                                    <td className="py-4 px-2 text-center text-slate-400">{details[p.schoolId]?.r5}</td>
                                    <td className="py-4 px-2 text-right font-black text-white text-lg">{result.scores?.[p.schoolId]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        }

        return null
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">Record <span className="text-primary">Books.</span></h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Live match results and official archives</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/60 p-2 rounded-2xl border border-white/5">
                    {sports.map(sport => (
                        <button
                            key={sport}
                            onClick={() => setSelectedSport(sport)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedSport === sport ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                        >
                            {sport}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search winners by team or tournament..."
                    className="w-full bg-slate-900/60 border border-white/5 rounded-[2.5rem] py-6 pl-16 pr-8 text-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-600 font-medium"
                />
            </div>

            {/* Match List */}
            <div className="space-y-4">
                {filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                        <div key={match.id} className="group bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:bg-slate-800/40 transition-all border-l-4 border-l-transparent hover:border-l-primary/50">
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                                            {match.sportType === 'quiz' ? <Brain className="text-purple-400" /> : match.sportType === 'football' ? <Trophy className="text-yellow-400" /> : <Zap className="text-primary" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-white uppercase tracking-tight">{match.tournamentName || "Regional Open"}</h3>
                                                <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest">{match.stage}</span>
                                            </div>
                                            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                                <Calendar className="h-3 w-3" />
                                                {match.startTime || "Concluded"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Result Display */}
                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-6">
                                            {match.participants.map((p, idx) => (
                                                <div key={p.schoolId} className="flex flex-col items-center">
                                                    <span className={`text-xl font-black ${match.result?.winner === p.schoolId ? 'text-primary' : 'text-white/60'}`}>
                                                        {match.result?.scores?.[p.schoolId] ?? 0}
                                                    </span>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mt-1 truncate max-w-[60px]">{p.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                                            className="p-3 bg-white/5 rounded-2xl hover:bg-primary hover:text-slate-950 transition-all group/btn"
                                        >
                                            {expandedMatch === match.id ? <ChevronUp /> : <ChevronDown className="group-hover/btn:translate-y-0.5 transition-transform" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded View */}
                                {expandedMatch === match.id && renderScoreDetail(match)}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-32 text-center bg-slate-900/20 rounded-[3rem] border border-dashed border-white/5 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Trophy className="h-10 w-10 text-slate-800" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">No results recorded</h2>
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-2 max-w-[200px] leading-relaxed">Matches in progress or scheduled will appear here once settled.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
