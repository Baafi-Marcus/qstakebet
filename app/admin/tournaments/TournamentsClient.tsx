"use client"

import { useState } from "react"
import { Plus, Trophy, MapPin, Calendar, Activity, ChevronRight, Search, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { Tournament, School } from "@/lib/types"
import { createTournament, updateTournament, deleteTournament } from "@/lib/admin-actions"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, AlertCircle } from "lucide-react"

export function TournamentsClient({ initialTournaments, universities }: { initialTournaments: Tournament[], universities: School[] }) {
    const router = useRouter()
    const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        region: "Ashanti",
        sportType: "football",
        gender: "male",
        year: new Date().getFullYear().toString(),
        level: "shs",
        format: "league", // Default to league
        groups: "A, B, C",
        parentUniversityId: ""
    })

    const filteredTournaments = tournaments.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.region.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            if (editingTournament) {
                const result = await updateTournament(editingTournament.id, formData)
                if (result) {
                    setTournaments(prev => prev.map(t => t.id === editingTournament.id ? { ...t, ...result[0] } : t))
                }
            } else {
                const newTournament = await createTournament(formData)
                if (newTournament && newTournament.length > 0) {
                    const created = {
                        ...newTournament[0],
                        createdAt: newTournament[0].createdAt || null
                    } as Tournament
                    setTournaments([created, ...tournaments])
                }
            }

            setIsCreateModalOpen(false)
            setEditingTournament(null)
            setFormData({
                name: "",
                region: "Ashanti",
                sportType: "football",
                gender: "male",
                year: new Date().getFullYear().toString(),
                level: "shs",
                format: "league",
                groups: "A, B, C",
                parentUniversityId: ""
            })
            router.refresh()
        } catch (error) {
            console.error("Failed to save tournament", error)
            alert("Failed to save tournament")
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tournament? This cannot be undone.")) return
        setIsDeleting(id)
        try {
            const result = await deleteTournament(id)
            if (result.success) {
                setTournaments(prev => prev.filter(t => t.id !== id))
                router.refresh()
            } else {
                alert(result.error || "Failed to delete tournament")
            }
        } catch (error) {
            console.error("Delete error:", error)
            alert("An error occurred while deleting")
        } finally {
            setIsDeleting(null)
        }
    }

    const openEditModal = (t: Tournament) => {
        setEditingTournament(t)
        const meta = (t.metadata as any) || {}
        setFormData({
            name: t.name,
            region: t.region,
            sportType: t.sportType,
            gender: t.gender,
            year: t.year,
            level: t.level || 'shs',
            format: meta.format || "league",
            groups: meta.groups ? meta.groups.join(", ") : "A, B, C",
            parentUniversityId: meta.parentUniversityId || ""
        })
        setIsCreateModalOpen(true)
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Tournaments</h1>
                    <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Manage all inter-school competitions.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95 uppercase tracking-wide"
                >
                    <Plus className="h-5 w-5" />
                    Create Tournament
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Active", value: tournaments.filter(t => t.status === 'active').length, color: "bg-green-500" },
                    { label: "Total", value: tournaments.length, color: "bg-purple-500" },
                    { label: "Sports", value: new Set(tournaments.map(t => t.sportType)).size, color: "bg-blue-500" },
                    { label: "Regions", value: new Set(tournaments.map(t => t.region)).size, color: "bg-orange-500" },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className="text-2xl font-black text-white">{stat.value}</div>
                        <div className={`h-1 w-8 ${stat.color} mt-3 rounded-full`} />
                    </div>
                ))}
            </div>

            {/* Filters and Search */}
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search tournaments by name or region..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Tournament List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredTournaments.length > 0 ? (
                    filteredTournaments.map((tournament) => (
                        <div key={tournament.id} className="group bg-slate-900/40 border border-white/5 hover:border-white/10 p-5 rounded-2xl transition-all hover:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-600/10 rounded-xl text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">{tournament.name}</h3>
                                        {tournament.status === 'active' && (
                                            <span className="flex items-center gap-1 bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-500/20">
                                                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-xs uppercase tracking-wide font-bold">
                                        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {tournament.region}</span>
                                        <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> {tournament.sportType} • {tournament.gender}</span>
                                        <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {tournament.year}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-end md:self-auto">
                                <button
                                    onClick={() => openEditModal(tournament)}
                                    className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5"
                                    title="Edit Tournament"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(tournament.id)}
                                    disabled={isDeleting === tournament.id}
                                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-xl transition-all border border-red-500/20 disabled:opacity-50"
                                    title="Delete Tournament"
                                >
                                    {isDeleting === tournament.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                                <Link
                                    href={`/admin/tournaments/${tournament.id}`}
                                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                                >
                                    Manage
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center bg-slate-900/20 rounded-3xl border border-dashed border-white/5">
                        <Trophy className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 font-medium uppercase tracking-wide text-sm">No tournaments found.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                {editingTournament ? "Edit Tournament" : "Create Tournament"}
                            </h2>
                            <button onClick={() => {
                                setIsCreateModalOpen(false)
                                setEditingTournament(null)
                            }} className="text-slate-500 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tournament Name</label>
                                <input
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                    placeholder="e.g. Ashanti Inter-Schools 2026"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Region</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.region}
                                        onChange={e => setFormData({ ...formData, region: e.target.value })}
                                    >
                                        <option value="Ashanti">Ashanti</option>
                                        <option value="Greater Accra">Greater Accra</option>
                                        <option value="Central">Central</option>
                                        <option value="Western">Western</option>
                                        <option value="Eastern">Eastern</option>
                                        <option value="Volta">Volta</option>
                                        <option value="Northern">Northern</option>
                                        <option value="Upper East">Upper East</option>
                                        <option value="Upper West">Upper West</option>
                                        <option value="Bono">Bono</option>
                                        <option value="Bono East">Bono East</option>
                                        <option value="Ahafo">Ahafo</option>
                                        <option value="Western North">Western North</option>
                                        <option value="Oti">Oti</option>
                                        <option value="Savannah">Savannah</option>
                                        <option value="North East">North East</option>
                                        <option value="National">National</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Year</label>
                                    <input
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Sport</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.sportType}
                                        onChange={e => setFormData({ ...formData, sportType: e.target.value })}
                                    >
                                        <option value="football">Football</option>
                                        <option value="athletics">Athletics</option>
                                        <option value="basketball">Basketball</option>
                                        <option value="volleyball">Volleyball</option>
                                        <option value="handball">Handball</option>
                                        <option value="quiz">Quiz</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Gender</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="mixed">Mixed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Level</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.level}
                                        onChange={e => setFormData({ ...formData, level: e.target.value })}
                                    >
                                        <option value="shs">SHS</option>
                                        <option value="university">University</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Format</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.format}
                                        onChange={e => setFormData({ ...formData, format: e.target.value })}
                                    >
                                        <option value="league">League (Groups)</option>
                                        <option value="knockout">Straight Knockout</option>
                                    </select>
                                </div>
                            </div>

                            {formData.format === 'league' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Initial Groups</label>
                                    <input
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        placeholder="e.g. A, B, C"
                                        value={formData.groups}
                                        onChange={e => setFormData({ ...formData, groups: e.target.value })}
                                    />
                                </div>
                            )}

                            {formData.level === 'university' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Primary Institution (University)</label>
                                    <select
                                        required={formData.level === 'university'}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                        value={formData.parentUniversityId}
                                        onChange={e => setFormData({ ...formData, parentUniversityId: e.target.value })}
                                    >
                                        <option value="">Select University...</option>
                                        {universities.map(uni => (
                                            <option key={uni.id} value={uni.id}>{uni.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {editingTournament ? "Update Tournament" : "Create Tournament"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
