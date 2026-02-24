"use client"

import { usePathname } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { BetSlipSidebar } from "./BetSlipSidebar"
import { Header } from "./Header"
import { SubNavBar } from "./SubNavBar"
import { Footer } from "./Footer"
import { InteractiveLayer } from "./InteractiveLayer"
import { SessionProvider } from "next-auth/react"
import React, { useEffect, useState, useContext } from "react"
import { BetSlipContext, BetSlipProvider } from "@/lib/store/context"
import { MatchDetailsModal } from "@/components/ui/MatchDetailsModal"
import { getMatchById } from "@/lib/data"
import { Match, Announcement } from "@/lib/types" // Added Announcement type
import { useBetSlip } from "@/lib/store/useBetSlip"
import { AdBannerCarousel } from "@/components/home/AdBannerCarousel"
import { getActiveAnnouncements } from "@/lib/announcement-actions"
import { PullToRefresh } from "@/components/ui/PullToRefresh"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAuthPage = pathname?.startsWith("/auth")
    const isAdmin = pathname?.startsWith("/admin")
    const isVirtuals = pathname?.startsWith("/virtuals")

    const [announcements, setAnnouncements] = useState<Announcement[]>([])

    useEffect(() => {
        if (!isAdmin && !isAuthPage) {
            getActiveAnnouncements().then(data => {
                setAnnouncements(data as Announcement[])
            })
        }
    }, [isAdmin, isAuthPage])

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

                    {/* Ad/Announcement Bar between Main Nav and SubNav */}
                    {!isVirtuals && !isAuthPage && announcements.length > 0 && (
                        <AdBannerCarousel announcements={announcements} />
                    )}

                    {/* Sticky Secondary Navigation (Sports/Regions) */}
                    {!isVirtuals && !isAuthPage && <SubNavBar />}

                    <div className="flex-1 flex flex-col">
                        <PullToRefresh disabled={isAuthPage || isAdmin}>
                            <main className="flex-1 min-w-0">
                                {children}
                            </main>
                        </PullToRefresh>
                    </div>

                    {/* Standard Footer */}
                    {!isVirtuals && !isAuthPage && <Footer />}

                    {/* Overlay components */}
                    {(() => {
                        const noBetslipPaths = [
                            '/auth',
                            '/admin',
                            '/virtuals',
                            '/account',
                            '/rewards',
                            '/help',
                            '/how-to-play',
                            '/privacy',
                            '/terms',
                            '/cookies'
                        ]
                        const hideBetslip = noBetslipPaths.some(path => pathname?.startsWith(path))

                        if (hideBetslip) {
                            return (
                                <>
                                    {!isAuthPage && !isAdmin && !isVirtuals && <BottomNav />}
                                    <InteractiveLayer />
                                </>
                            )
                        }

                        return (
                            <>
                                <BetSlipSidebar />
                                <BottomNav />
                                <GlobalMatchDetails />
                                <InteractiveLayer />
                            </>
                        )
                    })()}
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
