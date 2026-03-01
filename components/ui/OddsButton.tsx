"use client"

import { cn, normalizeMarketName } from "@/lib/utils"
// import { useBetSlip, type Selection } from "@/lib/store/useBetSlip"
import React from "react"
import { BetSlipContext } from "@/lib/store/context"
import type { Selection } from "@/lib/store/context"
import { Lock } from "lucide-react"
import { haptics } from "@/lib/haptics"
import { audio } from "@/lib/audio"

interface OddsButtonProps {
    label: string
    odds: number | null
    matchId: string
    marketName: string
    matchLabel: string
    className?: string
    showLabel?: boolean
    onClick?: (selection: Selection) => void
    isSelected?: boolean
    isCorrelated?: boolean
    isLocked?: boolean // Added isLocked
    id?: string // Explicit selection ID override
    sportType?: string // Added sportType
    tournamentId?: string // Added tournamentId for outrights
    tournamentName?: string
    stage?: string
}

export function OddsButton({
    label,
    odds,
    matchId,
    marketName,
    matchLabel,
    className,
    showLabel = true,
    onClick,
    isSelected: manualSelected,
    isCorrelated,
    isLocked, // Destructure isLocked
    id: explicitId,
    sportType,
    tournamentId,
    tournamentName,
    stage
}: OddsButtonProps) {
    const context = React.useContext(BetSlipContext)
    // if (!context) throw new Error("Missing Context") // Optional: Context might be undefined if not wrapped, but shouldn't happen

    // Fallback if context missing (e.g. server render without provider?)
    const selections = context?.selections || []
    const addSelection = context?.addSelection || (() => { })

    // Construct a unique ID for this specific option
    const normalizedMarket = normalizeMarketName(marketName)
    const selectionId = explicitId || `${matchId}-${normalizedMarket}-${label}` // e.g. "match123-Match Winner-School A"

    const isSelected = manualSelected !== undefined ? manualSelected : selections.some((s) => s.selectionId === selectionId)

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!odds || odds === 0 || isLocked) return; // Add isLocked check

        // Trigger haptic and audio feedback
        haptics.light()
        audio.light()

        const selection = {
            matchId,
            selectionId,
            label,
            odds: odds,
            marketName,
            matchLabel,
            sportType,
            tournamentId,
            tournamentName,
            stage
        }
        if (onClick) {
            onClick(selection)
        } else {
            addSelection(selection)
        }
    }

    if (!odds || odds === 0 || isCorrelated || isLocked) { // Add isLocked check
        // Handle undefined, null, 0, correlated or locked
        return (
            <button
                disabled
                className={cn(
                    "flex flex-col items-center justify-center py-1 px-1 rounded-md transition-all duration-200 border bg-white/5 border-white/5 cursor-not-allowed opacity-50",
                    "font-medium text-sm w-full",
                    (isCorrelated || isLocked) && "grayscale brightness-50", // Extra visual for correlation or lock
                    className
                )}
            >
                {showLabel && (
                    <span className="text-[8px] text-slate-600 mb-0.5 uppercase" suppressHydrationWarning>{label}</span>
                )}
                <Lock className="h-3 w-3 text-slate-600" />
            </button>
        )
    }

    return (
        <button
            onClick={handleClick}
            className={cn(
                "flex flex-col items-center justify-center py-1 px-1 rounded-md transition-all duration-200 border",
                "font-medium text-sm w-full",
                isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-[1.02]"
                    : "bg-card hover:bg-slate-700 border-border text-foreground hover:border-slate-500",
                className
            )}
        >
            {showLabel && (
                <span className="text-[9px] text-muted-foreground mb-0.5 font-bold uppercase" suppressHydrationWarning>{label}</span>
            )}
            <span className="font-black text-[11px] text-accent font-display tracking-tight leading-none">{odds.toFixed(2)}</span>
        </button>
    )
}
