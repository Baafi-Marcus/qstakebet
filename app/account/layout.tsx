"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserIcon as User, Cog6ToothIcon as Settings, ArrowRightStartOnRectangleIcon as LogOut, ChevronRightIcon as ChevronRight, QuestionMarkCircleIcon as HelpCircle, BookOpenIcon as BookOpen } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils"
import { getUserProfileSummary } from "@/lib/user-actions"
import { useEffect, useState } from "react"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [lifetimePoints, setLifetimePoints] = useState<number>(0)

    useEffect(() => {
        getUserProfileSummary().then((res: any) => {
            if (res.success) setLifetimePoints(res.lifetimePoints ?? 0)
        })
    }, [pathname])

    const menuItems = [
        { href: "/account/profile", label: "My Profile", icon: User },
        { href: "/help", label: "Help Center", icon: HelpCircle },
        { href: "/how-to-play", label: "How to Play", icon: BookOpen },
        { href: "/account/settings", label: "Settings", icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <main className="container max-w-6xl mx-auto px-4 pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar navigation - Hidden on mobile, shown on desktop */}
                    <div className="hidden lg:block lg:col-span-4 self-start sticky top-24">
                        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] overflow-hidden">
                            <nav className="p-3">
                                {menuItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-4 px-5 py-4 rounded-3xl transition-standard duration-200 group text-lg font-bold mb-1",
                                                isActive
                                                    ? "bg-foreground text-background"
                                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                            )}
                                        >
                                            <Icon className={cn("h-6 w-6", isActive ? "text-background" : "text-muted-foreground group-hover:text-foreground")} />
                                            <span>{item.label}</span>
                                            <ChevronRight className={cn("ml-auto h-5 w-5 opacity-0 group-hover:opacity-100 transition-all", isActive && "opacity-100")} />
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="lg:col-span-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
