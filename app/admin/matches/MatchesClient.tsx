"use client"

import { useState } from "react"
import { Plus, Activity, Search, X, Loader2, Sparkles } from "lucide-react"
import { Match, Tournament, School } from "@/lib/types"
import { createMatch, startMatches, lockMatches } from "@/lib/admin-actions"
import { useRouter } from "next/navigation"
import { MatchResultModal } from "./MatchResultModal"
import { BulkResultModal } from "./BulkResultModal"
import { MarketReviewModal } from "./MarketReviewModal"
import { Lock } from "lucide-react"

export function MatchesClient({
    initialMatches,
    tournaments,
    schools
}: {
    initialMatches: Match[],
    tournaments: Tournament[],
    schools: School[]
}) {
    const router = useRouter()
    const [matches, setMatches] = useState<Match[]>(initialMatches)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [selectedMatchForResult, setSelectedMatchForResult] = useState<Match | null>(null)
    const [selectedMatchForAI, setSelectedMatchForAI] = useState<Match | null>(null)
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

    // Bulk Start/Lock State
    const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([])
    const [isBulkStarting, setIsBulkStarting] = useState(false)
    const [isBulkLocking, setIsBulkLocking] = useState(false)

    const toggleMatchSelection = (id: string) => {
        if (selectedMatchIds.includes(id)) {
            setSelectedMatchIds(prev => prev.filter(mid => mid !== id))
        } else {
            setSelectedMatchIds(prev => [...prev, id])
        }
    }

    const handleBulkStart = async () => {
        if (!confirm(`Are you sure you want to START ${selectedMatchIds.length} matches? This will lock betting.`)) return;
        setIsBulkStarting(true)
        try {
            await startMatches(selectedMatchIds)
            // Update local state optimistically
            setMatches(prev => prev.map(m => selectedMatchIds.includes(m.id) ? { ...m, status: 'live', isLive: true } : m))
            setSelectedMatchIds([])
            router.refresh()
        } catch (e) {
            console.error(e)
            alert("Failed to start matches")
        } finally {
            setIsBulkStarting(false)
        }
    }

    const handleBulkLock = async () => {
        if (!confirm(`Are you sure you want to LOCK betting for ${selectedMatchIds.length} matches?`)) return;
        setIsBulkLocking(true)
        try {
            await lockMatches(selectedMatchIds)
            // Update local state optimistically
            setMatches(prev => prev.map(m => selectedMatchIds.includes(m.id) ? { ...m, status: 'locked' } : m))
            setSelectedMatchIds([])
            router.refresh()
        } catch (e) {
            console.error(e)
            alert("Failed to lock matches")
        } finally {
            setIsBulkLocking(false)
        }
    }

    // Form State
    const [formData, setFormData] = useState({
        tournamentId: "",
        schoolIds: [] as string[],
        stage: "Group Stage",
        startTime: "",
        sportType: "football",
        gender: "male"
    })

    // Helper to find tournament name
    const getTournamentName = (id: string | null | undefined) => {
        if (!id) return "Unknown Tournament"
        return tournaments.find(t => t.id === id)?.name || "Unknown Tournament"
    }

    // Helper to find school name
    const getSchoolName = (id: string) => {
        return schools.find(s => s.id === id)?.name || "Unknown"
    }

    const filteredMatches = matches.filter(m => {
        const tName = getTournamentName(m.tournamentId).toLowerCase()
        const pNames = m.participants.map(p => p.name.toLowerCase()).join(" ")
        const query = searchQuery.toLowerCase()
        return tName.includes(query) || pNames.includes(query) || m.stage.toLowerCase().includes(query)
    })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.schoolIds.length < 2) {
            alert("Please select at least 2 schools")
            return
        }

        setIsCreating(true)
        try {
            const newMatch = await createMatch({
                ...formData,
                startTime: formData.startTime || "Live" // Default or validated
            })

            if (newMatch && newMatch.length > 0) {
                const created = {
                    ...newMatch[0],
                    // Ensure participants match the type structure expected by client if DB returns JSON columns differently
                    // Typically Drizzle handles this, but casting for safety
                    participants: newMatch[0].participants as unknown[]
                } as Match

                setMatches([created, ...matches])
                setIsCreateModalOpen(false)
                // Reset minimal form
                setFormData(prev => ({ ...prev, schoolIds: [], startTime: "" }))
                router.refresh()
            }
        } catch (error) {
            console.error("Failed to create match", error)
            alert("Failed to create match")
        } finally {
            setIsCreating(false)
        }
    }

    // School Selection Helper
    const [schoolSearch, setSchoolSearch] = useState("")
    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(schoolSearch.toLowerCase()) &&
        // Optional: filter by region if tournament selected?
        (formData.tournamentId ? s.region === tournaments.find(t => t.id === formData.tournamentId)?.region : true)
    ).slice(0, 50) // Limit for performance

    const toggleSchool = (id: string) => {
        if (formData.schoolIds.includes(id)) {
            setFormData(prev => ({ ...prev, schoolIds: prev.schoolIds.filter(sid => sid !== id) }))
        } else {
            setFormData(prev => ({ ...prev, schoolIds: [...prev.schoolIds, id] }))
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Matches Management</h1>
                    <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Monitor & Resolve Competition Events</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95 uppercase tracking-wide"
                    >
                        <Sparkles className="h-5 w-5" />
                        Bulk Entry (AI)
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95 uppercase tracking-wide"
                    >
                        <Plus className="h-5 w-5" />
                        Create Match
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-3xl border border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search matches by school, tournament or stage..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>
            </div>

            {/* Match List */}
            <div className="grid grid-cols-1 gap-4">
                {/* Bulk Actions Bar */}
                {selectedMatchIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-purple-500/50 p-4 rounded-2xl shadow-2xl shadow-purple-900/50 flex items-center gap-6 z-40 animate-in slide-in-from-bottom-5">
                        <div className="text-white font-bold text-sm">
                            <span className="text-purple-400">{selectedMatchIds.length}</span> Selected
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkLock}
                                disabled={isBulkLocking || isBulkStarting}
                                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
                            >
                                {isBulkLocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                Lock Bets
                            </button>
                            <button
                                onClick={handleBulkStart}
                                disabled={isBulkStarting || isBulkLocking}
                                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
                            >
                                {isBulkStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                                Set Live
                            </button>
                        </div>
                        <button onClick={() => setSelectedMatchIds([])} className="text-slate-500 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                        <div key={match.id} className={`group bg-slate-900/40 border p-6 rounded-[2rem] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-8 ${selectedMatchIds.includes(match.id) ? 'border-purple-500/50 bg-purple-900/10' : 'border-white/5 hover:border-white/10 hover:bg-slate-800/40'}`}>
                            <div className="flex items-start gap-5">
                                {/* Checkbox for Bulk Selection */}
                                <div className="pt-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedMatchIds.includes(match.id)}
                                        onChange={() => toggleMatchSelection(match.id)}
                                        className="h-5 w-5 rounded border-white/20 bg-black/50 checked:bg-purple-600 focus:ring-purple-500 transition-all cursor-pointer"
                                    />
                                </div>

                                <div className={`p-4 rounded-2xl ${match.isLive ? "bg-red-500/10 text-red-500" : "bg-purple-600/10 text-purple-400"}`}>
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{getTournamentName(match.tournamentId)}</h3>
                                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">{match.stage}</span>
                                        {match.status && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${match.status === 'live' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                match.status === 'finished' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                    match.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                                                        match.status === 'locked' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                }`}>
                                                {match.status}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-slate-400 text-sm font-medium flex gap-2">
                                        {match.participants?.map(p => p.name).join(" vs ")}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 justify-between lg:justify-end">
                                <div className="text-right">
                                    <div className={`text-xs font-black uppercase tracking-widest ${match.isLive ? "text-red-500 animate-pulse" : "text-slate-500"}`}>
                                        {match.startTime}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Start Schedule</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {match.status === 'upcoming' && (
                                        <button
                                            onClick={() => setSelectedMatchForAI(match)}
                                            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 text-xs font-bold rounded-lg transition-all uppercase tracking-wide flex items-center gap-2"
                                        >
                                            <Sparkles className="h-3 w-3" />
                                            AI Markets
                                        </button>
                                    )}

                                    {match.status !== 'finished' && (
                                        <button
                                            onClick={() => setSelectedMatchForResult(match)}
                                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-bold rounded-lg transition-all uppercase tracking-wide"
                                        >
                                            Enter Result
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center bg-slate-900/20 rounded-3xl border border-dashed border-white/5">
                        <Activity className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 font-medium uppercase tracking-wide text-sm">No matches found.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Create Match</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                            {/* Tournament & Meta */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tournament</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.tournamentId}
                                        onChange={e => {
                                            const t = tournaments.find(t => t.id === e.target.value)
                                            setFormData({
                                                ...formData,
                                                tournamentId: e.target.value,
                                                sportType: t?.sportType || "football",
                                                gender: t?.gender || "male"
                                            })
                                        }}
                                    >
                                        <option value="">Select Tournament</option>
                                        {tournaments.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Stage</label>
                                    <input
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        placeholder="e.g. Quarter Final"
                                        value={formData.stage}
                                        onChange={e => setFormData({ ...formData, stage: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">School Selection (Select 2+)</label>
                                <input
                                    className="w-full bg-slate-800 border border-white/10 rounded-t-xl p-3 text-white text-sm focus:outline-none placeholder:text-slate-600"
                                    placeholder="Search schools..."
                                    value={schoolSearch}
                                    onChange={e => setSchoolSearch(e.target.value)}
                                />
                                <div className="h-48 overflow-y-auto border border-t-0 border-white/10 rounded-b-xl bg-black/20 p-2 space-y-1">
                                    {filteredSchools.length > 0 ? filteredSchools.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => toggleSchool(s.id)}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${formData.schoolIds.includes(s.id) ? 'bg-purple-600/20 border border-purple-500/50' : 'hover:bg-white/5 border border-transparent'}`}
                                        >
                                            <div className="text-sm font-bold text-white">{s.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.region}</div>
                                        </div>
                                    )) : (
                                        <div className="text-slate-500 text-xs p-4 text-center">No schools found</div>
                                    )}
                                </div>
                                <div className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-wide">
                                    Selected: {formData.schoolIds.map(id => getSchoolName(id)).join(", ")}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Match Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-wide">Schedule for future or leave for immediate</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-slate-900 shrink-0">
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !formData.tournamentId || formData.schoolIds.length < 2}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isCreating ? "Creating..." : "Create Match"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Review Modal */}
            {selectedMatchForAI && (
                <MarketReviewModal
                    match={selectedMatchForAI}
                    onClose={() => setSelectedMatchForAI(null)}
                    onSuccess={() => {
                        router.refresh()
                        setSelectedMatchForAI(null)
                    }}
                />
            )}

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

            {/* Bulk Result Modal */}
            {isBulkModalOpen && (
                <BulkResultModal
                    onClose={() => setIsBulkModalOpen(false)}
                    onSuccess={() => {
                        router.refresh()
                        setIsBulkModalOpen(false)
                    }}
                />
            )}
        </div>
    )
}
