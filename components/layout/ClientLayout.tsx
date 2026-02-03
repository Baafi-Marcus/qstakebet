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
                        </>
                    )}
                </div>
            </BetSlipProvider>
        </SessionProvider>
    )
}
