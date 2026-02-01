"use client"

import { usePathname } from "next/navigation"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/admin/login"

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <AdminHeader />
            <div className="flex flex-1">
                <AdminSidebar />
                <main className="flex-1 p-10 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* Admin Footer */}
            <footer className="py-6 px-10 border-t border-white/5 bg-slate-950/50">
                <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        QSTAKE Management Console v2.0
                    </div>
                    <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        Server Time: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </footer>
        </div>
    )
}
