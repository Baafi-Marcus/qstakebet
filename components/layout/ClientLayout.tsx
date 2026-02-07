"use client"

import { usePathname } from "next/navigation"
import { BetSlipProvider } from "@/lib/store/context"
import { BottomNav } from "./BottomNav"
import { FloatingBetSlipButton } from "./FloatingBetSlipButton"
import { BetSlipSidebar } from "./BetSlipSidebar"
import { Header } from "./Header"
import { SubNavBar } from "./SubNavBar"
import { Footer } from "./Footer"
import { SessionProvider } from "next-auth/react"
import React, { useEffect, useState, useContext } from "react"
import { BetSlipContext } from "@/lib/store/context"
import { MatchDetailsModal } from "@/components/ui/MatchDetailsModal"
import { getMatchById } from "@/lib/data"
import { Match } from "@/lib/types"
import { useBetSlip } from "@/lib/store/useBetSlip"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAuthPage = pathname?.startsWith("/auth")
    const isAdmin = pathname?.startsWith("/admin")
    const isVirtuals = pathname?.startsWith("/virtuals")

    // Admin Layout (Minimal)
    if (isAdmin) {
        return (
            <SessionProvider>
                <BetSlipProvider>
                    <div className="min-h-screen bg-background">
                        {children}
                    </div>
                </BetSlipProvider>
            </SessionProvider>
        )
    }

    return (
        <SessionProvider>
            <BetSlipProvider>
                <div className="min-h-screen flex flex-col bg-background">
                    {/* Sticky Main Header */}
                    {!isVirtuals && <Header />}

                    {/* Sticky Secondary Navigation (Sports/Regions) */}
                    {!isVirtuals && !isAuthPage && <SubNavBar />}

                    <div className="flex-1 flex flex-col">
                        <main className="flex-1 min-w-0">
                            {children}
                        </main>
                    </div>

                    {/* Standard Footer */}
                    {!isVirtuals && !isAuthPage && <Footer />}

                    {/* Overlay components */}
                    {!isAuthPage && !isVirtuals && (
                        <>
                            <BetSlipSidebar />
                            <FloatingBetSlipButton />
                            <BottomNav />
                            <GlobalMatchDetails />
                        </>
                    )}
                </div>
            </BetSlipProvider>
        </SessionProvider>
    )
}

function GlobalMatchDetails() {
    const context = useContext(BetSlipContext)
    const { addSelection, checkSelected } = useBetSlip()
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

    useEffect(() => {
        let active = true;
        if (context?.selectedMatchId) {
            getMatchById(context.selectedMatchId).then(match => {
                if (active && match) setSelectedMatch(match)
            })
        }
        return () => { active = false }
    }, [context?.selectedMatchId])

    const isMatchLoaded = selectedMatch && context?.selectedMatchId === selectedMatch.id;
    if (!context?.selectedMatchId || !isMatchLoaded) return null

    return (
        <MatchDetailsModal
            match={selectedMatch}
            onClose={() => context?.setSelectedMatchId(null)}
            onOddsClick={addSelection}
            checkSelected={checkSelected}
        />
    )
}
