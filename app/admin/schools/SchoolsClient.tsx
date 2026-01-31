"use client"

import { useState } from "react"
import { Plus, Search, Filter } from "lucide-react"

type School = {
    id: string
    name: string
    region: string
    // Add other fields if needed for display, e.g. rating if available
}

export function SchoolsClient({ initialSchools }: { initialSchools: School[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    // ... possibly other filters

    const filteredSchools = initialSchools.filter(school =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.region.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Schools Database</h1>
                    <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Manage registered institutions ({initialSchools.length})</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search name or region..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">#</th>
                                <th className="px-6 py-4">School Name</th>
                                <th className="px-6 py-4">Region</th>
                                <th className="px-6 py-4 text-right">Rating</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSchools.map((school, index) => (
                                <tr key={school.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{(index + 1).toString().padStart(3, '0')}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{school.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wide border border-white/5">
                                            {school.region}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-slate-500 font-mono">--</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-purple-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredSchools.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No schools found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
