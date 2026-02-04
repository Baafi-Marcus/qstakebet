"use client"

import { useState, useEffect } from "react"
import {
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    Users,
    Smartphone,
    CreditCard,
    ChevronDown,
    AlertCircle,
    Loader2
} from "lucide-react"
import { getAllWithdrawalRequests, adminProcessWithdrawal } from "@/lib/withdrawal-actions"
import { cn } from "@/lib/utils"

export default function AdminWithdrawalsPage() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("pending") // pending, paid, rejected, approved
    const [searchTerm, setSearchTerm] = useState("")
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [adminNotes, setAdminNotes] = useState("")

    useEffect(() => {
        loadRequests()
    }, [])

    async function loadRequests() {
        setLoading(true)
        try {
            const data = await getAllWithdrawalRequests()
            setRequests(data)
        } catch (error) {
            console.error("Failed to load requests:", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAction(requestId: string, status: 'paid' | 'rejected') {
        setProcessingId(requestId)
        try {
            const result = await adminProcessWithdrawal(requestId, status, adminNotes)
            if (result.success) {
                setAdminNotes("")
                loadRequests()
            } else {
                alert(result.error)
            }
        } catch (error) {
            console.error("Action error:", error)
        } finally {
            setProcessingId(null)
        }
    }

    const filteredRequests = requests.filter(req => {
        const matchesFilter = filter === "all" || req.status === filter
        const matchesSearch =
            req.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.userPhone?.includes(searchTerm) ||
            req.accountNumber?.includes(searchTerm)
        return matchesFilter && matchesSearch
    })

    const stats = {
        pending: requests.filter(r => r.status === 'pending').length,
        totalAmount: requests.filter(r => r.status === 'paid').reduce((acc, r) => acc + r.amount, 0)
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Withdrawal Management</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Review and process manual payouts</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl text-center min-w-[120px]">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Pending</p>
                        <p className="text-2xl font-black text-amber-500">{stats.pending}</p>
                    </div>
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl text-center min-w-[160px]">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Paid</p>
                        <p className="text-2xl font-black text-emerald-500">₵{stats.totalAmount.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-3xl border border-white/5">
                <div className="flex gap-2 bg-black/20 p-1.5 rounded-2xl shrink-0">
                    {["pending", "paid", "rejected", "all"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === f ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name, phone or account..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 focus:border-purple-600 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-white outline-none"
                    />
                </div>
            </div>

            {/* Request List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/20 border border-dashed border-white/5 rounded-[3rem]">
                        <Clock className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No requests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">
                                    <th className="px-6 py-2">User / Details</th>
                                    <th className="px-6 py-2">Method</th>
                                    <th className="px-6 py-2">Amount</th>
                                    <th className="px-6 py-2">Status</th>
                                    <th className="px-6 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map((req) => (
                                    <tr key={req.id} className="bg-slate-900/40 hover:bg-slate-900/80 border border-white/5 transition-all group">
                                        <td className="px-6 py-6 first:rounded-l-3xl">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">{req.userName || "N/A"}</span>
                                                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                    <Smartphone className="h-3 w-3 text-slate-600" />
                                                    <span className="text-[10px] font-bold text-slate-500">{req.userPhone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-3 w-3 text-purple-400" />
                                                    <span className="text-[10px] font-black text-white uppercase">{req.paymentMethod.replace('_', ' ')}</span>
                                                </div>
                                                <span className="text-[11px] font-mono font-bold text-slate-400">{req.accountNumber}</span>
                                                {req.accountName && <span className="text-[8px] text-slate-500 uppercase font-black">{req.accountName}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-lg font-black text-white tracking-tighter">₵{req.amount.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                req.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                                                    req.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" :
                                                        "bg-red-500/10 text-red-500"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full",
                                                    req.status === 'pending' ? "bg-amber-500 animate-pulse" :
                                                        req.status === 'paid' ? "bg-emerald-500" : "bg-red-500"
                                                )} />
                                                {req.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 last:rounded-r-3xl">
                                            {req.status === 'pending' ? (
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Notes..."
                                                        className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] font-bold text-white outline-none w-24 focus:w-40 transition-all focus:border-purple-600"
                                                        onChange={(e) => setAdminNotes(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={() => handleAction(req.id, 'paid')}
                                                        disabled={processingId === req.id}
                                                        className="p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                                                        title="Mark as Paid"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req.id, 'rejected')}
                                                        disabled={processingId === req.id}
                                                        className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                                                        title="Reject Request"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-[9px] font-black text-slate-700 uppercase">
                                                    PROCESSED {new Date(req.createdAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="p-6 bg-slate-900 border border-white/5 rounded-[2rem] flex items-start gap-4 mx-auto max-w-2xl">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Manual Processing Protocol</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        1. Verify the user&apos;s details and balance. <br />
                        2. Manually send funds via your Mobile Money business portal. <br />
                        3. ONLY mark as &quot;Paid&quot; once you have confirmation from the provider. <br />
                        4. If rejecting, provide a clear reason in the notes for the user.
                    </p>
                </div>
            </div>
        </div>
    )
}
