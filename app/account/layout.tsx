"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, History, Wallet, Gift, Settings, LogOut, ChevronRight, HelpCircle, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUserProfileSummary } from "@/lib/user-actions"
import { useEffect, useState } from "react"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [balance, setBalance] = useState<number>(0)

    useEffect(() => {
        getUserProfileSummary().then((res: any) => {
            if (res.success) setBalance(res.balance ?? 0)
        })
    }, [pathname])

    const menuItems = [
        { href: "/account/profile", label: "My Profile", icon: User },
        { href: "/account/bets", label: "My Bets", icon: History },
        { href: "/account/wallet", label: "Wallet & Balance", icon: Wallet },
        { href: "/account/bonuses", label: "Offers & Bonuses", icon: Gift },
        { href: "/help", label: "Help Center", icon: HelpCircle },
        { href: "/how-to-play", label: "How to Play", icon: BookOpen },
        { href: "/account/settings", label: "Settings", icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-[#0f1115] text-white pb-20">
            <main className="container max-w-6xl mx-auto px-4 pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar navigation - Hidden on mobile, shown on desktop */}
                    <div className="hidden lg:block lg:col-span-4 self-start sticky top-24">
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <nav className="p-3">
                                {menuItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-4 px-5 py-4 rounded-3xl transition-all duration-200 group text-lg font-bold mb-1",
                                                isActive
                                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            <Icon className={cn("h-6 w-6", isActive ? "text-white" : "text-purple-400 group-hover:scale-110 transition-transform")} />
                                            <span>{item.label}</span>
                                            <ChevronRight className={cn("ml-auto h-5 w-5 opacity-0 group-hover:opacity-100 transition-all", isActive && "opacity-100")} />
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>

                        {/* Quick balance card (sidebar) */}
                        <div className="mt-6 p-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] shadow-xl shadow-purple-500/10">
                            <div className="flex items-center gap-2 text-indigo-100 text-sm font-bold uppercase tracking-wider mb-2">
                                <Wallet className="h-4 w-4" />
                                Total Balance
                            </div>
                            <div className="text-4xl font-black text-white">GHS <span className="text-white">{balance.toFixed(2)}</span></div>
                            <Link href="/account/deposit" className="mt-6 block w-full bg-white text-purple-600 hover:bg-indigo-50 font-black py-4 rounded-2xl text-center transition-colors">
                                RECHARGE NOW
                            </Link>
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
