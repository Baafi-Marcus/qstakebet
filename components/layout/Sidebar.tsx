"use client"

import Link from "next/link"
import { Trophy, Star, Zap, MessageSquare } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const MAIN_MENU = [
    { label: "Home", icon: Star, href: "/" },
    { label: "Fantasy Draft", icon: Zap, href: "/fantasy" },
    { label: "Banter Rooms", icon: MessageSquare, href: "/chat" },
    { label: "Rankings", icon: Trophy, href: "/leaderboard" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden border-r border-border bg-card/40 lg:block w-64 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto py-6 px-4 custom-scrollbar">
            <div className="space-y-6">
                {/* Main Menu */}
                <div className="px-3">
                    <div className="space-y-1">
                        {MAIN_MENU.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                                        isActive
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-white" : "text-slate-500")} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="px-7 pt-4">
                    <Link
                        href="/admin"
                        className="text-[10px] font-black text-slate-600 hover:text-purple-400 transition-colors uppercase tracking-[0.2em] border-t border-white/5 pt-4 block"
                    >
                        Admin Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
