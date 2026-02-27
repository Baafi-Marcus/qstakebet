"use client"

import { useState, useEffect } from "react"
import { Plus, Trophy, MapPin, Calendar, Activity, ChevronRight, Search, X, Loader2, Building2, GraduationCap, ChevronLeft, Users, Layers } from "lucide-react"
import Link from "next/link"
import { Tournament, School } from "@/lib/types"
import { createTournament, updateTournament, forceDeleteTournament } from "@/lib/admin-actions"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"

const STEPS = ["Basics", "Details", "Format"]

const FIELD_CLS = "w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none transition-all"
const LABEL_CLS = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5"

const REGIONS = ["Ashanti", "Greater Accra", "Central", "Western", "Eastern", "Volta", "Northern", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo", "Western North", "Oti", "Savannah", "North East", "National"]
const SPORTS = [["football", "Football"], ["athletics", "Athletics"], ["basketball", "Basketball"], ["volleyball", "Volleyball"], ["handball", "Handball"], ["quiz", "Quiz"]]

const DEFAULT_FORM = {
    name: "", region: "Ashanti", sportType: "football", gender: "male",
    year: new Date().getFullYear().toString(), level: "shs",
    format: "league", groups: "Group A, Group B, Group C", parentUniversityId: ""
}

export function TournamentsClient({ initialTournaments, universities }: { initialTournaments: Tournament[], universities: School[] }) {
    const router = useRouter()
    const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [step, setStep] = useState(0)
    const [formData, setFormData] = useState({ ...DEFAULT_FORM })
    const [viewMode, setViewMode] = useState<"active" | "archive">("active")

    // Sync state with props when server-side data changes (e.g. after refresh)
    useEffect(() => {
        setTournaments(initialTournaments)
    }, [initialTournaments])

    const set = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }))

    const filteredTournaments = tournaments.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.region.toLowerCase().includes(searchQuery.toLowerCase())

        const isCompleted = t.status === 'completed'
        const matchesView = viewMode === 'active' ? !isCompleted : isCompleted

        return matchesSearch && matchesView
    })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            const payload = { ...formData }
            if (editingTournament) {
                const result = await updateTournament(editingTournament.id, payload) as Tournament[]
                if (result?.length > 0) setTournaments(prev => prev.map(t => t.id === editingTournament.id ? { ...t, ...result[0] } as Tournament : t))
            } else {
                const newT = await createTournament(payload)
                if (newT?.length > 0) setTournaments([{ ...newT[0], createdAt: newT[0].createdAt || null } as Tournament, ...tournaments])
            }
            closeModal()
            router.refresh()
        } catch (error) {
            console.error("Failed to save tournament", error)
            alert("Failed to save tournament")
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this tournament AND ALL its matches? This cannot be undone.")) return
        setIsDeleting(id)
        try {
            const result = await forceDeleteTournament(id)
            if (result.success) { setTournaments(prev => prev.filter(t => t.id !== id)); router.refresh() }
            else alert(result.error || "Failed to delete")
        } catch { alert("An error occurred") }
        finally { setIsDeleting(null) }
    }

    const closeModal = () => {
        setIsCreateModalOpen(false)
        setEditingTournament(null)
        setFormData({ ...DEFAULT_FORM })
        setStep(0)
    }

    const openEditModal = (t: Tournament) => {
        setEditingTournament(t)
        const meta = (t.metadata as any) || {}
        setFormData({
            name: t.name, region: t.region, sportType: t.sportType, gender: t.gender,
            year: t.year, level: t.level || 'shs',
            format: meta.format || "league",
            groups: meta.groups ? meta.groups.join(", ") : "Group A, Group B, Group C",
            parentUniversityId: meta.parentUniversityId || ""
        })
        setStep(0)
        setIsCreateModalOpen(true)
    }

    // Step validation — Next button only active when required fields are filled
    const isStep0Valid = formData.name.trim().length > 1 &&
        formData.year.trim().length === 4 &&
        (formData.level !== 'university' || !!formData.parentUniversityId)

    const isStep1Valid = !!formData.region && !!formData.sportType && !!formData.gender

    const isStep2Valid = !!formData.format && (formData.format !== 'league' || formData.groups.trim().length > 0)

    const canSubmit = isStep0Valid && isStep1Valid && isStep2Valid

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Tournaments</h1>
                    <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Manage all inter-school competitions.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTournament(null)
                        setFormData({ ...DEFAULT_FORM })
                        setStep(0)
                        setIsCreateModalOpen(true)
                    }}
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

            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 w-fit">
                <button
                    onClick={() => setViewMode("active")}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === "active" ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
                >
                    Active
                </button>
                <button
                    onClick={() => setViewMode("archive")}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === "archive" ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
                >
                    Archive
                </button>
            </div>

            {/* Filters and Search */}
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text" placeholder="Search tournaments..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Tournament List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredTournaments.length > 0 ? filteredTournaments.map((tournament) => (
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
                                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" /> ACTIVE
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-bold mt-1">
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tournament.region}</span>
                                    <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{tournament.sportType}</span>
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{tournament.year}</span>
                                    {tournament.level && <span className="text-purple-400 uppercase">{tournament.level}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button onClick={() => openEditModal(tournament)} className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(tournament.id)} disabled={isDeleting === tournament.id} className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all disabled:opacity-50">
                                {isDeleting === tournament.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                            <Link href={`/admin/tournaments/${tournament.id}`} className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600 border border-purple-500/20 text-purple-400 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all">
                                Manage <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                )) : (
                    <div className="p-20 text-center border border-dashed border-white/10 rounded-3xl bg-slate-950/20">
                        <Trophy className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">No tournaments found. Create one to get started.</p>
                    </div>
                )}
            </div>

            {/* ===== CREATE / EDIT MODAL ===== */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-950 border border-white/10 rounded-t-[2rem] md:rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div>
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-0.5">
                                    Step {step + 1} of {STEPS.length} — {STEPS[step]}
                                </p>
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                                    {editingTournament ? "Edit Tournament" : "New Tournament"}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex px-5 pt-4 gap-2 shrink-0">
                            {STEPS.map((s, i) => (
                                <div key={s} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-purple-500' : 'bg-white/10'}`} />
                            ))}
                        </div>

                        {/* Step Body */}
                        <div className="flex-1 overflow-y-auto p-5">
                            <form id="tournament-form" onSubmit={handleCreate}>

                                {/* STEP 0 — BASICS */}
                                {step === 0 && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <div>
                                            <label className={LABEL_CLS}>Tournament Name</label>
                                            <input required className={FIELD_CLS} placeholder="e.g. Ashanti Inter-Schools 2026"
                                                value={formData.name} onChange={e => set('name', e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={LABEL_CLS}>Year</label>
                                                <input required className={FIELD_CLS} placeholder="2026"
                                                    value={formData.year} onChange={e => set('year', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className={LABEL_CLS}>Level</label>
                                                <select className={FIELD_CLS} value={formData.level} onChange={e => set('level', e.target.value)}>
                                                    <option value="shs">SHS</option>
                                                    <option value="university">University</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* University sub-options */}
                                        {formData.level === 'university' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div>
                                                    <label className={LABEL_CLS}>University</label>
                                                    <select required={formData.level === 'university'} className={FIELD_CLS}
                                                        value={formData.parentUniversityId} onChange={e => set('parentUniversityId', e.target.value)}>
                                                        <option value="">Select University...</option>
                                                        {universities.map(uni => (
                                                            <option key={uni.id} value={uni.id}>{uni.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 1 — DETAILS */}
                                {step === 1 && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <div>
                                            <label className={LABEL_CLS}>Region</label>
                                            <select className={FIELD_CLS} value={formData.region} onChange={e => set('region', e.target.value)}>
                                                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={LABEL_CLS}>Sport</label>
                                                <select className={FIELD_CLS} value={formData.sportType} onChange={e => set('sportType', e.target.value)}>
                                                    {SPORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={LABEL_CLS}>Gender</label>
                                                <select className={FIELD_CLS} value={formData.gender} onChange={e => set('gender', e.target.value)}>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="mixed">Mixed</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2 — FORMAT */}
                                {step === 2 && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <div>
                                            <label className={LABEL_CLS}>Format</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { val: 'league', icon: Layers, label: 'League / Groups', desc: 'Group stage + knockout' },
                                                    { val: 'knockout', icon: Trophy, label: 'Straight Knockout', desc: 'Bracket from round 1' }
                                                ].map(({ val, icon: Icon, label, desc }) => (
                                                    <button key={val} type="button"
                                                        onClick={() => set('format', val)}
                                                        className={`flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all ${formData.format === val ? 'bg-purple-500/10 border-purple-500/50 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                                        <Icon className={`h-5 w-5 ${formData.format === val ? 'text-purple-400' : ''}`} />
                                                        <div>
                                                            <p className="font-black text-xs uppercase tracking-wide">{label}</p>
                                                            <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {formData.format === 'league' && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                                <label className={LABEL_CLS}>Initial Groups</label>
                                                <input className={FIELD_CLS} placeholder="e.g. Group A, Group B, Group C"
                                                    value={formData.groups} onChange={e => set('groups', e.target.value)} />
                                                <p className="text-[10px] text-slate-600 mt-1.5">Separate with commas. You can add more later via the Roster tab.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Modal Footer Nav */}
                        <div className="p-5 border-t border-white/5 flex items-center gap-3 shrink-0">
                            {step > 0 && (
                                <button type="button" onClick={() => setStep(s => s - 1)}
                                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest transition-all">
                                    <ChevronLeft className="h-4 w-4" /> Back
                                </button>
                            )}
                            {step < STEPS.length - 1 ? (
                                <button type="button" onClick={() => setStep(s => s + 1)}
                                    disabled={
                                        (step === 0 && !isStep0Valid) ||
                                        (step === 1 && !isStep1Valid)
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95">
                                    Next <ChevronRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const form = document.getElementById('tournament-form') as HTMLFormElement;
                                        if (form) form.requestSubmit();
                                    }}
                                    disabled={isCreating || !canSubmit}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-purple-900/20">
                                    {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {editingTournament ? "Update Tournament" : "Create Tournament"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
