"use client"

import { useState, useTransition } from "react"
import { MagnifyingGlassIcon as Search, PlusIcon as Plus, PencilSquareIcon as Edit2, TrashIcon as Trash2, XMarkIcon as X, DocumentCheckIcon as Save, ArrowPathRoundedSquareIcon as RefreshCcw } from "@heroicons/react/24/solid";
import { createSchoolAction, updateSchoolAction, deleteSchoolAction } from "@/lib/admin-actions"
import { useRouter } from "next/navigation"

type School = {
    id: string
    name: string
    region: string
    district?: string | null
    category?: string | null
    level?: string | null
    type?: string | null
    parentId?: string | null
}

const emptyForm = {
    name: "",
    region: "",
    district: "",
    level: "shs",
    type: "school",
    parentId: "",
    category: "A"
}

export function SchoolsClient({ initialSchools }: { initialSchools: School[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Modals State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingSchool, setEditingSchool] = useState<School | null>(null)

    // Form State
    const [formData, setFormData] = useState({ ...emptyForm })

    const filteredSchools = initialSchools.filter(school =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.region.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCreate = async () => {
        startTransition(async () => {
            const res = await createSchoolAction(formData)
            if (res.success) {
                setIsAddModalOpen(false)
                setFormData({ ...emptyForm })
                router.refresh()
            } else {
                alert((res as any).error || "Failed to create school")
            }
        })
    }

    const handleUpdate = async () => {
        if (!editingSchool) return
        startTransition(async () => {
            const res = await updateSchoolAction(editingSchool.id, formData)
            if (res.success) {
                setEditingSchool(null)
                router.refresh()
            } else {
                alert((res as any).error || "Failed to update school")
            }
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will permanently delete this school.")) return
        startTransition(async () => {
            const res = await deleteSchoolAction(id)
            if (res.success) {
                router.refresh()
            } else {
                alert((res as any).error || "Failed to delete school")
            }
        })
    }

    const openEditModal = (school: School) => {
        setEditingSchool(school)
        setFormData({
            name: school.name,
            region: school.region,
            district: school.district || "",
            level: school.level || "shs",
            type: school.type || "school",
            parentId: school.parentId || "",
            category: school.category || "A"
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Schools Database</h1>
                    <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Manage registered institutions ({initialSchools.length})</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search name or region..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ ...emptyForm });
                            setIsAddModalOpen(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all border border-purple-400/20"
                    >
                        <Plus className="h-4 w-4" />
                        Add School
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-white/5 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">School Name</th>
                                <th className="px-6 py-4">Region</th>
                                <th className="px-6 py-4">Level</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSchools.map((school) => (
                                <tr key={school.id} className="hover:bg-white/[0.03] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="font-black text-white uppercase tracking-tight text-sm whitespace-nowrap">
                                                {school.name}
                                                {school.type !== 'school' && (
                                                    <span className="ml-2 px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px]">
                                                        {school.type}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase">
                                                {school.parentId ? (
                                                    <span className="text-purple-400">@ {initialSchools.find(s => s.id === school.parentId)?.name}</span>
                                                ) : (
                                                    school.district || 'General'
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-tighter border border-white/5">
                                            {school.region}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-tighter border border-white/5">
                                            {school.level || 'shs'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(school)}
                                                className="p-2 hover:bg-purple-500/10 text-purple-400 rounded-lg transition-colors border border-transparent hover:border-purple-500/20"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(school.id)}
                                                className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: Add/Edit */}
            {(isAddModalOpen || editingSchool) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsAddModalOpen(false); setEditingSchool(null); }} />
                    <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                {isAddModalOpen ? 'Create Institution' : 'Edit Institution'}
                            </h2>
                            <button onClick={() => { setIsAddModalOpen(false); setEditingSchool(null); }} className="text-slate-500 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">School Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Region</label>
                                    <input
                                        type="text"
                                        value={formData.region}
                                        onChange={e => setFormData({ ...formData, region: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">District</label>
                                    <input
                                        type="text"
                                        value={formData.district}
                                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Level</label>
                                    <select
                                        value={formData.level}
                                        onChange={e => setFormData({ ...formData, level: e.target.value, type: e.target.value === 'shs' ? 'school' : formData.type })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                    >
                                        <option value="shs">SHS</option>
                                        <option value="university">University</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value, parentId: e.target.value === 'school' ? '' : formData.parentId })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                    >
                                        <option value="school">University / School</option>
                                        <option value="hall">Residential Hall</option>
                                        <option value="department">Department</option>
                                        <option value="program">Academic Program</option>
                                    </select>
                                </div>
                            </div>

                            {formData.type !== 'school' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parent University</label>
                                    <select
                                        value={formData.parentId}
                                        onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                    >
                                        <option value="">Select Parent University</option>
                                        {initialSchools.filter(s => s.type === 'school' && s.level === 'university').map(univ => (
                                            <option key={univ.id} value={univ.id}>{univ.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                            <button
                                onClick={() => { setIsAddModalOpen(false); setEditingSchool(null); }}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isPending || !formData.name || !formData.region}
                                onClick={editingSchool ? handleUpdate : handleCreate}
                                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {editingSchool ? 'Save Changes' : 'Create School'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
