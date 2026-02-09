"use client"

import { useState } from "react"
import {
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    ExternalLink,
    Smartphone,
    User as UserIcon,
    AlertTriangle,
    Loader2
} from "lucide-react"
import { approveManualWithdrawal, rejectManualWithdrawal } from "@/lib/admin-withdrawal-actions"
import { cn } from "@/lib/utils"

interface WithdrawalRequest {
    id: string
    userId: string
    amount: number
    status: string
    paymentMethod: string
    accountNumber: string
    accountName: string
    adminNotes: string | null
    createdAt: Date
    user: {
        name: string | null
        phone: string
    }
}

export default function WithdrawalManagementClient({ initialRequests }: { initialRequests: WithdrawalRequest[] }) {
    const [requests, setRequests] = useState(initialRequests)
    const [loading, setLoading] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<'pending' | 'paid' | 'rejected'>('pending')

    const counts = {
        pending: requests.filter(r => r.status === 'pending' || r.status === 'approved').length,
        paid: requests.filter(r => r.status === 'paid').length,
        rejected: requests.filter(r => r.status === 'rejected').length
    }

    const filteredRequests = requests.filter(req => {
        // Status filter
        const statusMatch =
            activeTab === 'pending' ? (req.status === 'pending' || req.status === 'approved') :
                activeTab === 'paid' ? (req.status === 'paid') :
                    (req.status === 'rejected')

        if (!statusMatch) return false

        // Search filter
        if (!searchTerm) return true

        return (
            req.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.accountNumber.includes(searchTerm) ||
            req.id.includes(searchTerm)
        )
    })

    const handleApprove = async (id: string) => {
        if (!confirm("Are you sure you have manually sent the funds to this user? This will finalize the transaction.")) return

        setLoading(id)
        const res = await approveManualWithdrawal(id)
        if (res.success) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "paid" } : r))
            alert("Withdrawal marked as paid successfully!")
        } else {
            alert(res.error || "Failed to approve")
        }
        setLoading(null)
    }

    const handleReject = async (id: string) => {
        const reason = prompt("Reason for rejection (will be shown to user):")
        if (reason === null) return

        setLoading(id)
        const res = await rejectManualWithdrawal(id, reason || "Invalid details")
        if (res.success) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected", adminNotes: reason } : r))
            alert("Withdrawal rejected and funds refunded!")
        } else {
            alert(res.error || "Failed to reject")
        }
        setLoading(null)
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-1 overflow-x-auto scroller-hidden">
                {[
                    { id: 'pending', label: 'Pending Payouts', count: counts.pending, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { id: 'paid', label: 'Paid / Confirmed', count: counts.paid, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { id: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-red-400', bg: 'bg-red-400/10' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-3 whitespace-nowrap",
                            activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {tab.label}
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black tracking-normal",
                            activeTab === tab.id ? tab.bg + " " + tab.color : "bg-slate-800 text-slate-600"
                        )}>
                            {tab.count}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search by name, phone, or ID..."
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-purple-500 outline-none transition-all font-bold placeholder:text-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">User / Date</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Payable Details</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                                <UserIcon className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white">{req.user.name || "Anonymous"}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">
                                                    {new Date(req.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-mono text-xs">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="h-3 w-3 text-slate-500" />
                                                <span className="text-slate-200 font-bold">{req.accountNumber}</span>
                                            </div>
                                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded-full inline-block">
                                                {req.paymentMethod.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <p className="text-lg font-black text-white tracking-tighter">
                                            GHS {req.amount.toFixed(2)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                                            req.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                req.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                                        )}>
                                            {req.status === 'paid' && <CheckCircle2 className="h-3 w-3" />}
                                            {req.status === 'rejected' && <XCircle className="h-3 w-3" />}
                                            {req.status === 'pending' && <Clock className="h-3 w-3" />}
                                            {req.status}
                                        </div>
                                        {req.adminNotes && (
                                            <p className="text-[9px] text-slate-500 mt-2 italic max-w-[150px] leading-relaxed">
                                                Note: {req.adminNotes}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-6">
                                        {(req.status === 'pending' || req.status === 'approved') ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    disabled={!!loading}
                                                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all disabled:opacity-50"
                                                    title="Mark as Paid"
                                                >
                                                    {loading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    disabled={!!loading}
                                                    className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all disabled:opacity-50"
                                                    title="Reject & Refund"
                                                >
                                                    {loading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded inline-block w-fit",
                                                    req.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                                )}>
                                                    {req.status === 'paid' ? 'Completed' : 'Rejected'}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest italic px-1">
                                                    Action Logged
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredRequests.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 rounded-[2.5rem] border border-dashed border-white/5">
                    <Clock className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">No withdrawal requests found</p>
                </div>
            )}

            {/* Manual Instructions Alert */}
            <div className="bg-purple-600/10 border border-purple-600/20 rounded-[2rem] p-8 mt-12">
                <div className="flex gap-4">
                    <div className="p-3 bg-purple-600/20 rounded-2xl h-fit">
                        <Smartphone className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Manual MoMo Payout Guide</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Step 1</p>
                                <p className="text-sm text-slate-300 font-medium">Copy the user&apos;s phone number and the exact amount.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Step 2</p>
                                <p className="text-sm text-slate-300 font-medium">Send MoMo manually from your phone/provider app.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Step 3</p>
                                <p className="text-sm text-slate-300 font-medium">Click the green checkmark above to finalize the transaction in-app.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
