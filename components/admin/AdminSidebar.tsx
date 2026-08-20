"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { TrophyIcon as Trophy, UsersIcon as Users, Cog6ToothIcon as Settings, SignalIcon as Activity, GiftIcon as Gift, MegaphoneIcon as Megaphone } from "@heroicons/react/24/solid";
import { Squares2X2Icon as LayoutDashboard, BuildingLibraryIcon as School, RocketLaunchIcon as Swords, PresentationChartLineIcon as LineChart, ComputerDesktopIcon as Monitor, CreditCardIcon as CreditCard, WifiIcon as Radio } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils"

const navItems = [
    { name: "Intelligence", href: "/admin", icon: LayoutDashboard },
    { name: "Verify Scores", href: "/admin/verify-results", icon: Megaphone },
    { name: "User Registry", href: "/admin/users", icon: Users },
    { name: "Tournaments", href: "/admin/tournaments", icon: Trophy },
    { name: "Institutions", href: "/admin/schools", icon: School },
    { name: "Live Dashboard", href: "/admin/live", icon: Radio },
    { name: "Live Odds", href: "/admin/matches", icon: Activity },
    { name: "Match Log", href: "/admin/matches/log", icon: Swords },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-72 bg-background border-r border-border/50 flex flex-col h-[calc(100vh-70px)] sticky top-[70px]">
            <div className="flex-1 py-8 px-4 overflow-y-auto space-y-8">
                <div>
                    <div className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-[0.2em] mb-4 px-4">Core Management</div>
                    <div className="space-y-1">
                        {navItems.slice(0, 3).map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                                    pathname === item.href
                                        ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-[0.2em] mb-4 px-4">Assets & Logs</div>
                    <div className="space-y-1">
                        {navItems.slice(3).map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                                    pathname === item.href
                                        ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-border/50 space-y-2">
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
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                >
                    <Settings className="h-4 w-4" />
                    System Preferences
                </Link>
            </div>
        </aside>
    )
}
