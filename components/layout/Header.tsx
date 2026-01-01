"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Wallet, Menu, User, X, Zap, Timer, Trophy } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const pathname = usePathname()

    const navLinks = [
        { href: "/", label: "Sports", icon: Trophy },
        { href: "/live", label: "Live", icon: Timer },
        { href: "/virtuals", label: "Virtuals", icon: Zap, status: "NEW" },
    ]

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
                            <span className="font-display font-bold text-xl text-primary">
                                QSTAKE<span className="text-foreground">bet</span>
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "transition-colors hover:text-foreground/80 relative flex items-center gap-1",
                                        pathname === link.href ? "text-foreground font-bold" : "text-muted-foreground",
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
                        <div className="flex items-center gap-2 bg-slate-900 rounded-full px-2 md:px-3 py-1 border border-slate-700">
                            <Wallet className="h-3 md:h-4 w-3 md:w-4 text-accent" />
                            <span className="text-xs md:text-sm font-mono font-medium text-foreground">GHS 500.00</span>
                        </div>
                        <button className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white ring-2 ring-primary/20">
                            <User className="h-4 w-4" />
                        </button>
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
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border shadow-2xl animate-in slide-in-from-left duration-300">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <span className="font-display font-bold text-lg text-primary">
                                QSTAKE<span className="text-foreground">bet</span>
                            </span>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-1 hover:bg-slate-800 rounded-full"
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
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                                            pathname === link.href
                                                ? "bg-primary/10 text-primary border border-primary/20"
                                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
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
                        </nav>
                    </div>
                </div>
            )}
        </>
    )
}
