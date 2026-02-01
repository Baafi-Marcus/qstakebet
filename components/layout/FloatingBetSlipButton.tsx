"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { BetSlipContext } from "@/lib/store/context"

export function FloatingBetSlipButton() {
    const pathname = usePathname()
    const context = React.useContext(BetSlipContext)
    const selections = context?.selections || []
    const isOpen = context?.isOpen || false
    const toggleSlip = context?.toggleSlip || (() => { })

    if (pathname === "/virtuals" || isOpen) return null

    return (
        <div className="fixed right-6 bottom-24 lg:bottom-12 z-[100] flex flex-col items-center gap-2">
            <button
                onClick={toggleSlip}
                className="h-12 w-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-white"
            >
                <span className="text-sm font-black">
                    {selections.length}
                </span>
            </button>
            <span className="text-[10px] font-black text-white uppercase tracking-tighter drop-shadow-md">Betslip</span>
        </div>
    )
}
