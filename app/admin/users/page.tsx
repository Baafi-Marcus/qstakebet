"use client"

import React, { useState, useEffect } from "react"
import { Search, Ban, CheckCircle, ArrowUpRight, Wallet } from "lucide-react"
import Link from "next/link"
import { getUsers, updateUserStatus } from "@/lib/admin-user-actions"
import { BalanceAdjustmentModal } from "./BalanceAdjustmentModal"
import { cn } from "@/lib/utils"

interface AdminUser {
    id: string
    name: string | null
    phone: string
    role: string
    status: string
    createdAt: Date | null
    balance: number | null
    referralCount: number
    linkClicks: number
}

export default function UsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // Balance Adjustment Modal State
    const [adjustingUser, setAdjustingUser] = useState<AdminUser | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        let isMounted = true
        const fetchData = async () => {
            const result = await getUsers(debouncedSearch)
            if (isMounted) {
                if (result.success) {
                    setUsers((result.users as unknown as AdminUser[]) || [])
                }
                setLoading(false)
            }
        }
        fetchData()
        return () => { isMounted = false }
    }, [debouncedSearch])

    const handleStatusToggle = async (userId: string, currentStatus: string) => {
        setLoading(true)
        const newStatus = (currentStatus === "active" ? "suspended" : "active") as "active" | "suspended"
        const result = await updateUserStatus(userId, newStatus)
        if (result.success) {
            // Trigger a re-fetch by updating the debounced search or just calling getUsers directly
            const refresh = await getUsers(debouncedSearch)
            if (refresh.success) {
                setUsers((refresh.users as unknown as AdminUser[]) || [])
            }
        }
        setLoading(false)
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">User Management</h1>
                    <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Monitor and manage platform users</p>
                </div>

                <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by phone/name..."
                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            if (e.target.value !== search) {
                                setLoading(true) // Trigger loading feedback immediately on type
                            }
                        }}
                    />
                </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role/Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Growth (C/R)</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Balance</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Joined</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-6 h-16 bg-white/[0.02]" />
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                                        No users found
                                    </td>
                                </tr>
                            ) : users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-xs font-black text-white">
                                                {u.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-white">{u.name}</div>
                                                <div className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{u.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-mono text-slate-300 font-bold">{u.phone}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className={cn(
                                                "w-fit px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                u.role === 'admin' ? "bg-orange-500/10 text-orange-400 border-orange-500/10" : "bg-blue-500/10 text-blue-400 border-blue-500/10"
                                            )}>
                                                {u.role}
                                            </div>
                                            <div className={cn(
                                                "w-fit px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                u.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-500"
                                            )}>
                                                {u.status}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="text-sm font-black text-white font-mono">GHS {u.balance?.toFixed(2) || '0.00'}</div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setAdjustingUser(u)}
                                                className="p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-500 transition-all active:scale-95"
                                                title="Adjust Balance"
                                            >
                                                <Wallet className="h-4 w-4" />
                                            </button>
                                            <Link
                                                href={`/admin/users/${u.id}`}
                                                className="p-2.5 rounded-xl bg-white/5 hover:bg-primary/20 text-slate-400 hover:text-primary transition-all active:scale-95"
                                            >
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleStatusToggle(u.id, u.status)}
                                                className={cn(
                                                    "p-2.5 rounded-xl transition-all active:scale-95",
                                                    u.status === 'active'
                                                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                        : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                                )}
                                            >
                                                {u.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {adjustingUser && (
                <BalanceAdjustmentModal
                    userId={adjustingUser.id}
                    userName={adjustingUser.name || 'Unknown User'}
                    currentBalance={adjustingUser.balance || 0}
                    onClose={() => setAdjustingUser(null)}
                    onSuccess={async () => {
                        const refresh = await getUsers(debouncedSearch)
                        if (refresh.success) {
                            setUsers((refresh.users as unknown as AdminUser[]) || [])
                        }
                    }}
                />
            )}
        </div>
    )
}
