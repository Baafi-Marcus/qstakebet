"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    User,
    History,
    Wallet,
    Gift,
    Settings,
    LogOut,
    ChevronRight,
    Search
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession()
    const pathname = usePathname()

    const menuItems = [
        { href: "/account/profile", label: "My Profile", icon: User },
        { href: "/account/bets", label: "My Bets", icon: History },
        { href: "/account/wallet", label: "Wallet & Balance", icon: Wallet },
        { href: "/account/bonuses", label: "Offers & Bonuses", icon: Gift },
        { href: "/account/settings", label: "Settings", icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Header / Banner area */}
            <div className="bg-gradient-to-b from-purple-900/30 to-slate-950 pt-8 pb-12 px-4">
                <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-4xl font-black shadow-2xl shadow-purple-500/20">
                        {session?.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{session?.user?.name || "User"}</h1>
                        <p className="text-slate-400 font-medium">Manage your account and track your activity</p>
                    </div>
                </div>
            </div>

            <main className="container max-w-6xl mx-auto px-4 -mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar navigation */}
                    <div className="lg:col-span-4 self-start">
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden">
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

                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="w-full flex items-center gap-4 px-5 py-4 rounded-3xl text-red-400 hover:bg-red-400/10 transition-all duration-200 text-lg font-bold"
                                    >
                                        <LogOut className="h-6 w-6" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </nav>
                        </div>

                        {/* Quick balance card (mobile/sidebar) */}
                        <div className="mt-6 p-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] shadow-xl shadow-purple-500/10">
                            <div className="flex items-center gap-2 text-indigo-100 text-sm font-bold uppercase tracking-wider mb-2">
                                <Wallet className="h-4 w-4" />
                                Total Balance
                            </div>
                            <div className="text-4xl font-black text-white">GHS <span className="text-white">0.00</span></div>
                            <Link href="/account/wallet" className="mt-6 block w-full bg-white text-purple-600 hover:bg-indigo-50 font-black py-4 rounded-2xl text-center transition-colors">
                                RECHARGE NOW
                            </Link>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="lg:col-span-8">
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 min-h-[600px]">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
