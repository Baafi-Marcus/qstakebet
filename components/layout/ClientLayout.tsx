"use client"

import { BetSlipProvider } from "@/lib/store/context"
import { BottomNav } from "./BottomNav"
import { FloatingBetSlipButton } from "./FloatingBetSlipButton"
import { BetSlipSidebar } from "./BetSlipSidebar"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <BetSlipProvider>
            {children}
            <BetSlipSidebar />
            <FloatingBetSlipButton />
            <BottomNav />
        </BetSlipProvider>
    )
}
