"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Trophy,
    School,
    Swords,
    Users,
    Settings,
    Activity,
    LineChart,
    Monitor,
    CreditCard,
    Gift,
    Radio
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { name: "Intelligence", href: "/admin", icon: LayoutDashboard },
    { name: "User Registry", href: "/admin/users", icon: Users },
    { name: "Bonuses", href: "/admin/bonuses", icon: Gift },
    { name: "Payouts", href: "/admin/withdrawals", icon: CreditCard },
    { name: "Live Dashboard", href: "/admin/live", icon: Radio },
    { name: "Live Odds", href: "/admin/matches", icon: Activity },
    { name: "Tournaments", href: "/admin/tournaments", icon: Trophy },
    { name: "Institutions", href: "/admin/schools", icon: School },
    { name: "Match Log", href: "/admin/matches/log", icon: Swords },
    { name: "Analytics", href: "/admin/analytics", icon: LineChart },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-72 bg-slate-950 border-r border-white/5 flex flex-col h-[calc(100vh-70px)] sticky top-[70px]">
            <div className="flex-1 py-8 px-4 overflow-y-auto space-y-8">
                <div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-4">Core Management</div>
                    <div className="space-y-1">
                        {navItems.slice(0, 3).map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                                    pathname === item.href
                                        ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                                        : "text-slate-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-4">Assets & Logs</div>
                    <div className="space-y-1">
                        {navItems.slice(3).map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                                    pathname === item.href
                                        ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                                        : "text-slate-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/5 space-y-2">
                <Link
                    href="/"
                    target="_blank"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-all"
                >
                    <Monitor className="h-4 w-4" />
                    View Live Site
                </Link>
                <Link
                    href="/admin/settings"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                >
                    <Settings className="h-4 w-4" />
                    System Preferences
                </Link>
            </div>
        </aside>
    )
}
