"use client"

import React, { useContext } from "react"
import { BetSlipContext } from "@/lib/store/context"
import { WinCelebration } from "@/components/ui/WinCelebration"
import { LiveScoreToast } from "@/components/ui/LiveScoreToast"
import { QuickDeposit } from "@/components/ui/QuickDeposit"

export function InteractiveLayer() {
    const context = useContext(BetSlipContext)

    if (!context) return null

    const {
        showDeposit,
        setShowDeposit,
        pendingWin,
        setPendingWin
    } = context

    return (
        <>
            {/* Win Celebration Overlay */}
            <WinCelebration
                isOpen={!!pendingWin}
                amount={pendingWin?.amount || 0}
                onClose={() => setPendingWin(null)}
            />

            {/* Quick Deposit Modal */}
            <QuickDeposit
                isOpen={showDeposit}
                onClose={() => setShowDeposit(false)}
            />

            {/* Example Live Score Toasts would be mapped here from a global state */}
        </>
    )
}
