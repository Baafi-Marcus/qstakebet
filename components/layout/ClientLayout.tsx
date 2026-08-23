"use client"

import { usePathname } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { SessionProvider } from "next-auth/react"
import React, { useEffect, useState } from "react"
import { Announcement } from "@/lib/types"
import { AdBannerCarousel } from "@/components/home/AdBannerCarousel"
import { getActiveAnnouncements } from "@/lib/announcement-actions"
import { PullToRefresh } from "@/components/ui/PullToRefresh"
import { SplashScreen } from "@/components/ui/SplashScreen"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAuthPage = pathname?.startsWith("/auth")
    const isAdmin = pathname?.startsWith("/admin")

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
                <div className="min-h-screen bg-background">
                    {children}
                </div>
            </SessionProvider>
        )
    }

    return (
        <SessionProvider>
            <SplashScreen>
                <div className="min-h-screen flex flex-col bg-background">
                    {/* Sticky Main Header */}
                    <Header />

                    {/* Ad/Announcement Bar between Main Nav and SubNav - Visible on all client pages */}
                    {announcements.length > 0 && (
                        <AdBannerCarousel announcements={announcements} />
                    )}

                    <div className="flex-1 flex flex-col">
                        <PullToRefresh disabled={isAuthPage || isAdmin}>
                            <main className="flex-1 min-w-0">
                                {children}
                            </main>
                        </PullToRefresh>
                    </div>

                    {/* Standard Footer */}
                    {!isAuthPage && <Footer />}

                    {/* Overlay components */}
                    {!isAuthPage && <BottomNav />}
                </div>
            </SplashScreen>
        </SessionProvider>
    )
}


