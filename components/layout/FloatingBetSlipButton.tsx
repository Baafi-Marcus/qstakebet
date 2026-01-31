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

    if (selections.length === 0 || pathname === "/virtuals" || isOpen) return null

    return (
        <button
            onClick={toggleSlip}
            className="fixed right-6 bottom-24 lg:bottom-12 z-[100] h-16 w-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 active:scale-95 border-4 border-white ring-4 ring-red-600/20"
        >
            <span className="text-2xl font-bold">
                {selections.length}
            </span>
        </button>
    )
}
