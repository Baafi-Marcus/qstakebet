"use client"

import { usePathname } from "next/navigation"
import { BetSlipProvider } from "@/lib/store/context"
import { BottomNav } from "./BottomNav"
import { FloatingBetSlipButton } from "./FloatingBetSlipButton"
import { BetSlipSidebar } from "./BetSlipSidebar"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { SessionProvider } from "next-auth/react"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAuthPage = pathname?.startsWith("/auth")
    const isAdmin = pathname?.startsWith("/admin")

    if (isAdmin) {
        return (
            <SessionProvider>
                <BetSlipProvider>
                    {children}
                </BetSlipProvider>
            </SessionProvider>
        )
    }

    return (
        <SessionProvider>
            <BetSlipProvider>
                <Header />
                <div className="flex pt-14 lg:pt-0"> {/* Adjusted for sticky header */}
                    <Sidebar />
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
                {!isAuthPage && (
                    <>
                        <BetSlipSidebar />
                        <FloatingBetSlipButton />
                    </>
                )}
                <BottomNav />
            </BetSlipProvider>
        </SessionProvider>
    )
}
