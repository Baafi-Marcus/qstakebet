"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { BetSlipContext } from "@/lib/store/context"
import { Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

export function FloatingBetSlipButton() {
    const pathname = usePathname()
    const context = React.useContext(BetSlipContext)
    const selections = context?.selections || []
    const isOpen = context?.isOpen || false
    const toggleSlip = context?.toggleSlip || (() => { })

    // HIDE RULES
    const isAuth = pathname?.startsWith("/auth")
    const isAdmin = pathname?.startsWith("/admin")
    const isAccount = pathname?.startsWith("/account")

    // Always hide if empty, sidebar is open, or on restricted pages
    if (selections.length === 0 || isOpen || isAuth || isAdmin || isAccount) return null

    return (
        <div className="fixed right-6 bottom-32 lg:bottom-12 z-[90] flex flex-col items-center group">
            <button
                onClick={toggleSlip}
                className={cn(
                    "h-16 w-16 bg-purple-600 hover:bg-purple-500 rounded-3xl flex flex-col items-center justify-center text-white shadow-[0_20px_40px_rgba(147,51,234,0.3)] transition-all hover:scale-110 active:scale-95 border-2 border-white/20 relative overflow-hidden group/btn",
                    "backdrop-blur-xl"
                )}
            >
                {/* Shine Animation */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />

                <div className="relative z-10 flex flex-col items-center">
                    <Ticket className="h-6 w-6 mb-1 animate-pulse" />
                    <span className="text-[7px] font-black uppercase tracking-[0.2em]">Bet Slip</span>
                </div>

                {/* Badge */}
                <div className="absolute top-2 right-2 h-5 w-5 bg-white text-purple-600 rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg">
                    {selections.length}
                </div>
            </button>

            {/* Tooltip-like label for larger screens */}
            <div className="mt-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden lg:block">
                <span className="text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap">View Your Slip</span>
            </div>
        </div>
    )
}
