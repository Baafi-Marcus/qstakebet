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

    const isVirtuals = pathname?.startsWith("/virtuals")

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
                {!isVirtuals && <Header />}
                <div className={pathname?.startsWith("/virtuals") ? "" : "flex pt-14 lg:pt-0"}>
                    {!isVirtuals && <Sidebar />}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
                {!isAuthPage && !isVirtuals && (
                    <>
                        <BetSlipSidebar />
                        <FloatingBetSlipButton />
                    </>
                )}
                {/* For virtuals, we might want to hide standard betslip sidebar as it uses its own betting logic? 
                    Actually, user didn't ask to remove it, but usually virtuals are self-contained. 
                    Let's hide it for now to avoid clutter, adhering to "own nav bar" request implies isolation. 
                    If user wants betslip, they usually have a custom one in virtuals. 
                    VirtualsClient has its own betslip logic (PendingSlips etc). 
                */}
                {!isVirtuals && <BottomNav />}
            </BetSlipProvider>
        </SessionProvider>
    )
}
