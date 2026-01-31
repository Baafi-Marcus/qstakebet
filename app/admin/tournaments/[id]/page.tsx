"use client"

import { useState, useEffect, use } from "react"
import { Trophy, Users, Calendar, ArrowLeft, Wand2 } from "lucide-react"
import Link from "next/link"
import { Tournament, School } from "@/lib/types"

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [schools, setSchools] = useState<School[]>([])
    const [roster, setRoster] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setTournament({
                id,
                name: "Ashanti Inter-Schools 2026",
                region: "Ashanti",
                sportType: "football",
                gender: "male",
                year: "2026",
                status: "active"
            })
            setSchools([
                { id: "s1", name: "Prempeh College", region: "Ashanti" },
                { id: "s2", name: "Opoku Ware School", region: "Ashanti" },
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        Roster
                    </h2>
                    <textarea
                        value={roster}
                        onChange={(e) => setRoster(e.target.value)}
                        placeholder="Schools..."
                        className="w-full h-48 bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                    <button
                        onClick={() => {
                            setIsSaving(true)
                            setTimeout(() => setIsSaving(false), 500)
                        }}
                        className="w-full mt-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 transition-colors"
                    >
                        {isSaving ? "Saving..." : "Add to Roster"}
                    </button>

                    <div className="mt-6 space-y-2">
                        {schools.map(s => (
                            <div key={s.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-sm font-medium text-slate-300">
                                {s.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 rounded-3xl p-8">
                    <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                        <Wand2 className="h-6 w-6 text-purple-400" />
                        Fixture Generator
                    </h2>
                    <div className="p-20 text-center border border-dashed border-white/10 rounded-3xl bg-slate-950/20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wand2 className="h-8 w-8 text-slate-700 opacity-20" />
                        </div>
                        <p className="text-slate-500 font-medium">Auto-Fixture logic ready for integration.</p>
                        <p className="text-slate-700 text-[10px] font-black uppercase tracking-widest mt-2">v.1.0 Ready</p>
                    </div>
                    <button className="w-full mt-8 py-4 bg-white hover:bg-slate-100 text-black rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-white/5">
                        GENERATE FIXTURE
                    </button>
                </div>
            </div>
        </div>
    )
}
