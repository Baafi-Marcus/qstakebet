"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Wallet, Menu, User, X, Zap, Timer, Trophy, LogOut, ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"
import { getUserWalletBalance } from "@/lib/wallet-actions"

export function Header() {
    const { data: session, status } = useSession()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [balance, setBalance] = useState<number | null>(null)
    const pathname = usePathname()

    React.useEffect(() => {
        if (status === "authenticated") {
            getUserWalletBalance().then(data => setBalance(data.balance))
        }
    }, [status])

    const navLinks = [
        { href: "/", label: "Sports", icon: Trophy },
        { href: "/live", label: "Live", icon: Timer },
        { href: "/virtuals", label: "Virtuals", icon: Zap, status: "NEW" },
    ]

    const isLoggedIn = status === "authenticated"

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="container flex h-14 items-center px-4 md:px-6 justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 py-2 w-9 px-0 md:hidden"
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </button>

                        <Link href="/" className="flex items-center space-x-2">
                            <span className="font-display font-medium text-xl text-primary font-black uppercase tracking-tight">
                                QSTAKE<span className="text-foreground">bet</span>
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "transition-colors hover:text-foreground/80 relative flex items-center gap-1 font-bold",
                                        pathname === link.href ? "text-foreground" : "text-muted-foreground",
                                        link.label === "Virtuals" && "text-accent"
                                    )}
                                >
                                    {link.label}
                                    {link.status && (
                                        <span className="bg-red-500 text-[8px] text-white px-1 rounded animate-pulse">
                                            {link.status}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-4">
                        {isLoggedIn ? (
                            <>
                                <div className="flex items-center gap-2 bg-slate-900 rounded-full px-2 md:px-3 py-1 border border-white/10">
                                    <Wallet className="h-3 md:h-4 w-3 md:w-4 text-accent" />
                                    <span className="text-xs md:text-sm font-mono font-black text-foreground">
                                        GHS {balance !== null ? balance.toFixed(2) : "..."}
                                    </span>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="h-9 px-2 rounded-full hover:bg-white/5 flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-purple-500/10">
                                            {session.user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", isProfileOpen && "rotate-180")} />
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-100">
                                            <div className="px-4 py-2 border-b border-white/5 mb-2">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">My Account</p>
                                                <p className="text-sm font-black truncate text-white">{session.user?.name}</p>
                                            </div>
                                            <Link href="/account/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white">
                                                <User className="h-4 w-4 text-purple-400" />
                                                Profile Details
                                            </Link>
                                            <Link href="/account/bets" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white">
                                                <Trophy className="h-4 w-4 text-purple-400" />
                                                Betting History
                                            </Link>
                                            <Link href="/account/wallet" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white">
                                                <Wallet className="h-4 w-4 text-purple-400" />
                                                Wallet & Deposit
                                            </Link>
                                            <div className="h-px bg-white/5 my-2" />
                                            <button
                                                onClick={() => {
                                                    setIsProfileOpen(false)
                                                    signOut({ callbackUrl: "/" })
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-400/10"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/auth/login"
                                    className="text-xs md:text-sm font-black text-slate-300 hover:text-white px-3 py-2 transition-colors"
                                >
                                    LOGIN
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="text-[10px] md:text-xs font-black bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary/20 tracking-tighter"
                                >
                                    JOIN NOW
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-white/10 shadow-2xl animate-in slide-in-from-left duration-300">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <span className="font-display font-black text-lg text-primary tracking-tight">
                                QSTAKE<span className="text-white">bet</span>
                            </span>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-1 hover:bg-white/5 rounded-full"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>
                        <nav className="py-6 px-4 space-y-2">
                            {navLinks.map((link) => {
                                const Icon = link.icon
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all",
                                            pathname === link.href
                                                ? "bg-primary/10 text-primary border border-primary/20"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {link.label}
                                        {link.status && (
                                            <span className="bg-red-500 text-[8px] text-white px-1.5 py-0.5 rounded ml-auto">
                                                {link.status}
                                            </span>
                                        )}
                                    </Link>
                                )
                            })}

                            {!isLoggedIn && (
                                <div className="pt-8 space-y-3">
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="w-full flex items-center justify-center font-black py-4 rounded-2xl border border-white/10 text-white hover:bg-white/5 transition-all text-sm"
                                    >
                                        LOGIN
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="w-full flex items-center justify-center font-black py-4 rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all text-sm shadow-xl shadow-primary/20"
                                    >
                                        JOIN NOW
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                </div>
            )}
        </>
    )
}
