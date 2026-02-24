"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BarChart2, X, Trophy } from "lucide-react"
import type { Match } from "@/lib/types"

interface GroupStandingsModalProps {
    tournamentName: string
    matches: Match[]
    groups: string[]
    groupAssignments: Record<string, string>
    allSchools: Array<{ id: string, name: string }>
}

export function GroupStandingsModal({
    tournamentName,
    matches,
    groups,
    groupAssignments,
    allSchools
}: GroupStandingsModalProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-11 px-6 rounded-2xl bg-white/5 border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all gap-2 font-black uppercase tracking-tight text-xs">
                    <BarChart2 className="h-4 w-4" />
                    Standings
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-950 border-white/5 p-0 overflow-hidden rounded-[2.5rem]">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <BarChart2 className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-white uppercase tracking-tight">Final Group Standings</DialogTitle>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{tournamentName}</p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 pt-2 space-y-6 max-h-[70vh] overflow-y-auto">
                    {groups.map(group => {
                        const gFinished = matches.filter(m => m.group === group && (m.status === 'finished' || m.status === 'settled'))
                        const rows: Record<string, any> = {}

                        gFinished.forEach(m => {
                            if (m.participants.length < 2) return
                            const [p1, p2] = m.participants
                            const s1 = typeof p1.result === 'number' ? p1.result : parseInt(String(p1.result || "0")) || 0
                            const s2 = typeof p2.result === 'number' ? p2.result : parseInt(String(p2.result || "0")) || 0
                                ;[p1, p2].forEach(p => { if (!rows[p.schoolId]) rows[p.schoolId] = { id: p.schoolId, name: p.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 } })
                            const r1 = rows[p1.schoolId], r2 = rows[p2.schoolId]
                            r1.p++; r2.p++; r1.gf += s1; r1.ga += s2; r2.gf += s2; r2.ga += s1
                            if (s1 > s2) { r1.w++; r1.pts += 3; r2.l++ }
                            else if (s2 > s1) { r2.w++; r2.pts += 3; r1.l++ }
                            else { r1.d++; r1.pts++; r2.d++; r2.pts++ }
                        })

                        allSchools.filter(s => groupAssignments[s.id] === group).forEach(s => {
                            if (!rows[s.id]) rows[s.id] = { id: s.id, name: s.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
                        })

                        const sorted = Object.values(rows).sort((a: any, b: any) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga))
                        if (sorted.length === 0) return null

                        return (
                            <div key={group} className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
                                <div className="px-5 py-3 bg-white/5 flex items-center justify-between border-b border-white/5">
                                    <span className="text-xs font-black text-white uppercase">{group}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Finished</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-white/5 text-slate-500 text-[9px]">
                                                <th className="text-left px-5 py-2 font-black">#</th>
                                                <th className="text-left px-0 pr-4 py-2 font-black">Team</th>
                                                {["P", "W", "D", "L", "PTS"].map(h => <th key={h} className="text-center px-2 py-2 font-black">{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sorted.map((s: any, idx: number) => (
                                                <tr key={s.id} className="border-b last:border-0 border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <span className={`w-5 h-5 inline-flex items-center justify-center rounded-md text-[9px] font-black ${idx < 2 ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>{idx + 1}</span>
                                                    </td>
                                                    <td className="py-3 pr-4 font-bold text-white uppercase truncate max-w-[120px]">{s.name}</td>
                                                    {[s.p, s.w, s.d, s.l].map((v, i) => (
                                                        <td key={i} className="text-center px-2 py-3 text-slate-400 font-bold">{v}</td>
                                                    ))}
                                                    <td className="text-center px-2 py-3 font-black text-purple-400">{s.pts}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
