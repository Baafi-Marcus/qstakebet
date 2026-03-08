"use client"

import React, { useState, useRef, useEffect } from "react"
import { Trophy, ChevronDown, ChevronUp, Share2, Edit2, Clock, Zap, Target, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { BetTicketModal } from "./BetTicketModal"

interface BetTicketProps {
    bet: any
    isHistory?: boolean
}

export function BetTicket({ bet, isHistory = false }: BetTicketProps) {
    const [showModal, setShowModal] = useState(false)

    const statusColor = bet.status === 'won' ? 'emerald' : bet.status === 'lost' ? 'red' : 'blue'
    const selections = bet.selections as any[]
    const isMultiple = selections.length > 1

    const formatDate = (date: string | Date) => {
        const d = new Date(date)
        return {
            day: d.toLocaleString('en-GB', { day: '2-digit' }),
            month: d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
        }
    }

    const { day, month } = formatDate(bet.createdAt)

    return (
        <div className="flex gap-3 md:gap-4 w-full group">
            {/* Date Gutter (Only for History) */}
            {isHistory && (
                <div className="flex flex-col items-center pt-2 w-8 md:w-12 shrink-0">
                    <span className="text-lg md:text-xl font-black text-white leading-none">{day}</span>
                    <span className="text-[10px] font-black text-slate-500 tracking-widest">{month}</span>
                </div>
            )}

            {/* Ticket Card */}
            <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:border-white/10">
                {/* Status Header Strip */}
                <div className={cn(
                    "px-6 py-2 flex items-center justify-between",
                    statusColor === 'emerald' ? "bg-emerald-500" :
                        statusColor === 'red' ? "bg-red-500" : "bg-slate-800"
                )}>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">
                            {bet.mode === 'system' ? 'System' : bet.mode === 'multi' ? 'Multiple' : bet.mode === 'single' ? 'Single' : (isMultiple ? "Multiple" : "Single")}
                        </span>
                        {bet.isBonusBet && (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded text-[8px] font-black uppercase tracking-tighter">
                                Gift
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {bet.status === 'won' && <Trophy className="h-3 w-3 text-white fill-white" />}
                        <span className="text-[10px] font-black uppercase text-white tracking-[0.1em]">
                            {bet.status}
                        </span>
                        <ChevronDown
                            className={cn("h-4 w-4 text-white/70 cursor-pointer transition-transform", showModal && "rotate-180")}
                            onClick={() => setShowModal(!showModal)}
                        />
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Summary View */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {selections.slice(0, 3).map((sel, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                                    <span className="text-sm font-bold text-slate-200 line-clamp-1">
                                        {sel.matchLabel}
                                    </span>
                                </div>
                            ))}
                            {selections.length > 3 && (
                                <div className="flex items-center justify-between pl-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        and {selections.length - 3} other matches
                                    </span>
                                    {isHistory && (
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                                        >
                                            Match Details
                                        </button>
                                    )}
                                </div>
                            )}
                            {selections.length <= 3 && isHistory && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                                    >
                                        Match Details
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expandable details have been replaced by BetTicketModal */}

                    {/* Footer Metrics */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between bg-slate-800/20 -mx-6 -mb-6 px-6 py-4 rounded-b-[2rem]">
                        <div className="flex gap-8">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                    {bet.mode === 'system' ? `Total Stake (${bet.combinations?.length} bets)` : "Total Stake"}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[10px] font-bold text-slate-500">GHS</span>
                                    <span className="text-xl font-black text-white">
                                        {(bet.mode === 'system' ? bet.stake * (bet.combinations?.length || 1) : bet.stake).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                    {bet.status === 'won' ? "Paid Return" : "Potential Win"}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[10px] font-bold text-slate-500">GHS</span>
                                    <span className={cn(
                                        "text-xl font-black",
                                        bet.status === 'won' ? "text-emerald-400" :
                                            bet.status === 'lost' ? "text-red-400" : "text-white"
                                    )}>
                                        {bet.status === 'lost' ? '0.00' : bet.potentialPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {bet.status === 'pending' && !isHistory && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Active Leg</span>
                            </div>
                        )}
                    </div>

                    {/* Ticket Metadata */}
                    <div className="pt-2 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">QuickStake • {bet.id.toUpperCase()}</span>
                    </div>
                </div>


            </div>

            <BetTicketModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                bet={bet}
            />
        </div>
    )
}
