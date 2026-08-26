"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { MobileAdminNav } from "@/components/admin/MobileAdminNav"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/admin/login"
    const [timeString, setTimeString] = useState<string>("")

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeString(new Date().toLocaleTimeString())
        }, 1000)
        
        return () => clearInterval(interval)
    }, [])

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AdminHeader />
            <MobileAdminNav />
            <div className="flex flex-1">
                <AdminSidebar />
                <main className="flex-1 px-4 py-6 md:px-10 md:py-10 max-w-7xl mx-auto w-full min-w-0">
                    {children}
                </main>
            </div>

            {/* Admin Footer */}
            <footer className="py-6 px-4 md:px-10 border-t border-border/50 bg-background/50">
                <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                        QSTAKE Management Console v2.0
                    </div>
                    <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                        Console Time: {timeString || "..."}
                    </div>
                </div>
            </footer>
        </div>
    )
}
