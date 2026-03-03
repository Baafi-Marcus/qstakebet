import { getAllBonuses } from "@/lib/bonus-actions"
import { Gift, User, Clock, CheckCircle2, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { IssueBonusModal } from "./IssueBonusModal"

export const dynamic = 'force-dynamic'

export default async function AdminBonusesPage() {
    const bonuses = await getAllBonuses()

    return (
        <div className="p-6 lg:p-10 space-y-10 min-h-screen">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/10">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-tighter text-xs mb-2">
                        <Gift className="h-4 w-4" />
                        Incentives Manager
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                        Bonus <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                            Management
                        </span>
                    </h1>
                </div>

                <IssueBonusModal />
            </div>

            {/* List Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Gift className="h-6 w-6 text-indigo-500" />
                        Recent Bonus Distributions
                    </h2>
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest hidden md:block">
                        Last 50 Records
                    </div>
                </div>

                <div className="bg-[#0f1115] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Issuance Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Recipient</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Benefit Details</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Credit Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bonuses.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-30">
                                                <Gift className="h-12 w-12 text-slate-600 mb-4" />
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">No bonuses found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : bonuses.map((bonus) => (
                                    <tr key={bonus.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                                                {new Date(bonus.createdAt!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                                                    <User className="h-5 w-5 text-slate-400 group-hover:text-indigo-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-white uppercase leading-tight group-hover:text-indigo-400 transition-colors">
                                                        {bonus.user || "System/Unknown"}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 tracking-tighter">
                                                        {bonus.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-900 border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                {bonus.type.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <BonusStatusBadge status={bonus.status!} />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-lg font-black text-white tracking-tighter">
                                                ₵{bonus.amount.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

function BonusStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'active':
            return (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <Clock className="h-3 w-3" />
                    Active
                </span>
            )
        case 'used':
            return (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="h-3 w-3" />
                    Redeemed
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
