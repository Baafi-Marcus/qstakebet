'use client'

import { useState } from "react"
import { Search, Filter, History, User, Activity, ArrowRight, ShieldAlert, CheckCircle2, Clock, Target, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { AdminBetDetailModal } from "@/components/admin/AdminBetDetailModal"

interface BetsClientProps {
    initialBets: any[]
}

export function BetsClient({ initialBets }: BetsClientProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedBet, setSelectedBet] = useState<any>(null)

    const filteredBets = initialBets.filter(bet => {
        const matchesSearch =
            bet.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bet.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bet.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || bet.status === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-8">
            <AdminBetDetailModal
                bet={selectedBet}
                isOpen={!!selectedBet}
                onClose={() => setSelectedBet(null)}
            />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-tighter text-xs mb-2">
                        <Activity className="h-4 w-4" />
                        Platform Monitoring
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                        Master <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-500">
                            Ticket Logs
                        </span>
                    </h1>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search ID, User, or Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-600 font-bold"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900/50 border border-white/5 rounded-2xl p-1">
                        {['all', 'pending', 'won', 'lost'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    statusFilter === status
                                        ? "bg-white text-black shadow-lg"
                                        : "text-slate-500 hover:text-white"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#0f1115] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ticket Details</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Financials</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBets.map((bet) => (
                                <tr
                                    key={bet.id}
                                    onClick={() => setSelectedBet(bet)}
                                    className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-2">
                                                <History className="h-3 w-3 text-slate-600" />
                                                {bet.id}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {bet.mode} • {bet.selections?.length || 0} Selections
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                <User className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white uppercase">{bet.userName || "Unknown User"}</span>
                                                <span className="text-[10px] font-bold text-slate-500 tracking-tighter">{bet.userEmail}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white">₵ {bet.stake.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                Payout: ₵ {bet.potentialPayout.toLocaleString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <StatusBadge status={bet.status} />
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end gap-2">
                                            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all group-hover:bg-primary group-hover:text-white group-hover:border-primary">
                                                <Eye className="h-3 w-3" />
                                                Audit Ticket
                                            </button>
                                            <span className="text-[10px] font-mono font-bold text-slate-600">
                                                {format(new Date(bet.createdAt), "MMM d, HH:mm")}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredBets.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <ShieldAlert className="h-12 w-12 text-slate-800 mb-4" />
                        <h3 className="text-white font-black uppercase text-sm tracking-widest">No matching tickets</h3>
                        <p className="text-slate-600 text-xs mt-1 uppercase font-bold">Try adjusting your filters or search term</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'pending':
            return (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <Clock className="h-3 w-3" />
                    Pending
                </span>
            )
        case 'won':
            return (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="h-3 w-3" />
                    Won
                </span>
            )
        case 'lost':
            return (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest">
                    <ShieldAlert className="h-3 w-3" />
                    Lost
                </span>
            )
        default:
            return (
                <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[9px] font-black uppercase tracking-widest">
                    {status}
                </span>
            )
    }
}
