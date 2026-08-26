"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Cog6ToothIcon as Settings } from "@heroicons/react/24/solid"
import { navItems } from "./AdminSidebar"
import { cn } from "@/lib/utils"

export function MobileAdminNav() {
    const pathname = usePathname()

    return (
        <nav className="lg:hidden sticky top-[70px] z-40 bg-background border-b border-border/50">
            <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
                <Link
                    href="/admin/settings"
                    className={cn(
                        "shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                        pathname === "/admin/settings"
                            ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                            : "text-muted-foreground bg-muted/50 border border-border/50"
                    )}
                >
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                </Link>
                {navItems.map((item) => {
                    const active = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                active
                                    ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                                    : "text-muted-foreground bg-muted/50 border border-border/50"
                            )}
                        >
                            <item.icon className="h-3.5 w-3.5" />
                            {item.name}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
