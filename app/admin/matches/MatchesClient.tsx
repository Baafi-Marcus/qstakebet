"use client"

import { useState } from "react"
import { Plus, Activity, Search, X, Loader2, Sparkles } from "lucide-react"
import { Match, Tournament, School } from "@/lib/types"
import { createMatch, startMatches, lockMatches, updateMatch, deleteMatch } from "@/lib/admin-actions"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Clock } from "lucide-react"
import { MatchResultModal } from "./MatchResultModal"
import { BulkResultModal } from "./BulkResultModal"
import { MarketReviewModal } from "./MarketReviewModal"
import { MatchHistoryModal } from "./MatchHistoryModal"
import { Lock, History } from "lucide-react"
import { MatchTimer } from "@/components/ui/MatchTimer"

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
    const [selectedMatchForHistory, setSelectedMatchForHistory] = useState<Match | null>(null)
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

    // Bulk Start/Lock State
    const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([])
    const [isBulkStarting, setIsBulkStarting] = useState(false)
    const [isBulkLocking, setIsBulkLocking] = useState(false)
    const [editingMatch, setEditingMatch] = useState<Match | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [sportFilter, setSportFilter] = useState<string>("all")

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
        group: "",
        matchday: "Matchday 1",
        startTime: "",
        autoEndAt: "",
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

        const matchesQuery = tName.includes(query) || pNames.includes(query) || m.stage.toLowerCase().includes(query)
        const matchesStatus = statusFilter === "all" || m.status === statusFilter
        const matchesSport = sportFilter === "all" || m.sportType === sportFilter

        return matchesQuery && matchesStatus && matchesSport
    })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.schoolIds.length < 2) {
            alert("Please select at least 2 schools")
            return
        }

        setIsCreating(true)
        try {
            if (editingMatch) {
                const result = await updateMatch(editingMatch.id, formData)
                if (result) {
                    setMatches((prev: Match[]) => prev.map(m => m.id === editingMatch.id ? ({
                        ...m,
                        ...result[0],
                        startTime: result[0].startTime || "",
                        participants: result[0].participants as any
                    } as Match) : m))
                }
            } else {
                const newMatch = await createMatch({
                    ...formData,
                    startTime: formData.startTime || "" // Allow empty for TBD
                })

                if (newMatch && newMatch.length > 0) {
                    const created = {
                        ...newMatch[0],
                        participants: newMatch[0].participants as any
                    } as Match
                    setMatches([created, ...matches])
                }
            }

            setIsCreateModalOpen(false)
            setEditingMatch(null)
            setFormData(prev => ({ ...prev, schoolIds: [], startTime: "", autoEndAt: "" }))
            router.refresh()
        } catch (error) {
            console.error("Failed to save match", error)
            alert("Failed to save match")
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteMatch = async (id: string) => {
        if (!confirm("Are you sure you want to delete this match? This cannot be undone.")) return
        setIsDeleting(id)
        try {
            const result = await deleteMatch(id)
            if (result.success) {
                setMatches(prev => prev.filter(m => m.id !== id))
                router.refresh()
            } else {
                alert(result.error || "Failed to delete match")
            }
        } catch (error) {
            console.error("Delete error:", error)
            alert("An error occurred while deleting")
        } finally {
            setIsDeleting(null)
        }
    }

    const openEditMatchModal = (match: Match) => {
        setEditingMatch(match)
        setFormData({
            tournamentId: match.tournamentId || "",
            schoolIds: match.participants.map(p => p.schoolId),
            stage: match.stage,
            group: match.group || "",
            matchday: match.matchday || "Matchday 1",
            // Note: startTime on object is the display string, we might need a separate ISO field if we want accuracy
            // But for now we'll just try to parse it or leave blank for TBD
            startTime: match.scheduledAt ? new Date(match.scheduledAt).toISOString().slice(0, 16) : "",
            autoEndAt: match.autoEndAt ? new Date(match.autoEndAt).toISOString().slice(0, 16) : "",
            sportType: match.sportType,
            gender: match.gender || "male"
        })
        setIsCreateModalOpen(true)
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
            <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900/60 p-4 rounded-3xl border border-white/5">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search matches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 md:flex-none bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 uppercase"
                    >
                        <option value="all">All Status</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="live">Live</option>
                        <option value="locked">Locked</option>
                        <option value="finished">Finished</option>
                        <option value="settled">Settled</option>
                    </select>
                    <select
                        value={sportFilter}
                        onChange={(e) => setSportFilter(e.target.value)}
                        className="flex-1 md:flex-none bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 uppercase"
                    >
                        <option value="all">All Sports</option>
                        <option value="football">Football</option>
                        <option value="quiz">Quiz</option>
                        <option value="athletics">Athletics</option>
                    </select>
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
                                                match.status === 'finished' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                    match.status === 'settled' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                        match.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                                                            match.status === 'locked' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                                'bg-slate-500/20 text-slate-400 border border-white/10'
                                                }`}>
                                                {match.status}
                                            </span>
                                        )}
                                        {match.status === 'upcoming' && match.startTime && !isNaN(new Date(match.startTime).getTime()) && new Date(match.startTime) < new Date() && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest bg-amber-600/20 text-amber-500 border border-amber-600/30 animate-pulse">
                                                LATE START
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
                                    <div className={`text-xs font-black uppercase tracking-widest ${match.isLive ? "text-red-500" : "text-slate-500"}`}>
                                        <MatchTimer
                                            startTime={match.startTime}
                                            status={match.status || 'upcoming'}
                                            sportType={match.sportType}
                                            metadata={match.liveMetadata}
                                            isLive={match.isLive}
                                        />
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Start Schedule</div>
                                </div>

                                {/* bet volume indicator */}
                                {(() => {
                                    const totalStake = Object.values(match.betVolume || {}).reduce((acc: number, curr: any) => acc + (curr.totalStake || 0), 0)
                                    if (totalStake === 0) return null
                                    return (
                                        <div className="hidden sm:block text-right px-4 border-r border-white/5">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Bet Volume</div>
                                            <div className={`text-sm font-mono font-bold ${totalStake > 100 ? "text-pink-500" : "text-slate-300"}`}>₵ {totalStake.toLocaleString()}</div>
                                        </div>
                                    )
                                })()}

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditMatchModal(match)}
                                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all border border-white/5"
                                        title="Edit Match"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMatch(match.id)}
                                        disabled={isDeleting === match.id}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg transition-all border border-red-500/20 disabled:opacity-50"
                                        title="Delete Match"
                                    >
                                        {isDeleting === match.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>

                                    {match.status === 'upcoming' && (
                                        <button
                                            onClick={() => setSelectedMatchForAI(match)}
                                            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 text-xs font-bold rounded-lg transition-all uppercase tracking-wide flex items-center gap-2"
                                        >
                                            <Sparkles className="h-3 w-3" />
                                            AI Markets
                                        </button>
                                    )}

                                    {match.status !== 'finished' && match.status !== 'settled' && (
                                        <button
                                            onClick={() => setSelectedMatchForResult(match)}
                                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-bold rounded-lg transition-all uppercase tracking-wide"
                                        >
                                            Enter Result
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setSelectedMatchForHistory(match)}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-white/5"
                                        title="View History"
                                    >
                                        <History className="h-4 w-4" />
                                    </button>
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
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                {editingMatch ? "Edit Match" : "Create Match"}
                            </h2>
                            <button onClick={() => {
                                setIsCreateModalOpen(false)
                                setEditingMatch(null)
                            }} className="text-slate-500 hover:text-white transition-colors">
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Group</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.group}
                                        onChange={e => setFormData({ ...formData, group: e.target.value })}
                                    >
                                        <option value="">No Group</option>
                                        <option value="Group A">Group A</option>
                                        <option value="Group B">Group B</option>
                                        <option value="Group C">Group C</option>
                                        <option value="Group D">Group D</option>
                                        <option value="Knockout">Knockout</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Matchday</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.matchday}
                                        onChange={e => setFormData({ ...formData, matchday: e.target.value })}
                                    >
                                        <option value="Matchday 1">Matchday 1</option>
                                        <option value="Matchday 2">Matchday 2</option>
                                        <option value="Matchday 3">Matchday 3</option>
                                        <option value="Matchday 4">Matchday 4</option>
                                        <option value="Matchday 5">Matchday 5</option>
                                        <option value="Matchday 6">Matchday 6</option>
                                        <option value="Quarter Final">Quarter Final</option>
                                        <option value="Semi Final">Semi Final</option>
                                        <option value="Final">Final</option>
                                    </select>
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
                                            <div className="flex flex-col">
                                                <div className="text-sm font-bold text-white uppercase tracking-tight">
                                                    {s.name}
                                                    {s.type !== 'school' && (
                                                        <span className="ml-2 text-[8px] px-1 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded">
                                                            {s.type}
                                                        </span>
                                                    )}
                                                </div>
                                                {s.parentId && (
                                                    <div className="text-[9px] text-purple-400 font-bold uppercase">
                                                        @ {schools.find(x => x.id === s.parentId)?.name}
                                                    </div>
                                                )}
                                            </div>
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
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Auto End Time (Recommended)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none border-dashed"
                                        value={formData.autoEndAt}
                                        onChange={e => setFormData({ ...formData, autoEndAt: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-wide italic">Optional: Match will move to pending at this time</p>
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
                                {editingMatch ? "Update Match" : "Create Match"}
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

            {/* History Modal */}
            {selectedMatchForHistory && (
                <MatchHistoryModal
                    matchId={selectedMatchForHistory.id}
                    matchName={`${getTournamentName(selectedMatchForHistory.tournamentId)}: ${selectedMatchForHistory.participants.map(p => p.name).join(" vs ")}`}
                    onClose={() => setSelectedMatchForHistory(null)}
                />
            )}
        </div>
    )
}
