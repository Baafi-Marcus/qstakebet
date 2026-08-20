"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
    Bars3Icon,
    UserIcon,
    XMarkIcon,
    BoltIcon,
    TrophyIcon,
    ArrowRightStartOnRectangleIcon,
    StarIcon,
    ChatBubbleLeftRightIcon,
    QuestionMarkCircleIcon,
    BookOpenIcon,
    ShieldExclamationIcon,
} from "@heroicons/react/24/solid"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"
import { getUserFantasyStats } from "@/lib/fantasy-actions"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function Header() {
    const { data: session, status } = useSession()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
    const [points, setPoints] = useState<number | null>(null)
    const pathname = usePathname()

    React.useEffect(() => {
        if (status === "authenticated") {
            getUserFantasyStats().then(data => {
                if (data.success) {
                    setPoints(data.totalFantasyPoints ?? 0)
                }
            })
        }
    }, [status])

    const handleLogout = () => {
        setIsLogoutConfirmOpen(true)
        setIsProfileOpen(false)
        setIsMenuOpen(false)
    }

    const confirmLogout = () => {
        signOut()
        setIsLogoutConfirmOpen(false)
    }

    const navLinks = [
        { href: "/", label: "Home", icon: StarIcon },
        { href: "/fantasy", label: "Fantasy Draft", icon: BoltIcon, status: "HOT" },
        { href: "/chat", label: "Banter Rooms", icon: ChatBubbleLeftRightIcon },
        { href: "/leaderboard", label: "Rankings", icon: TrophyIcon },
    ]

    const isLoggedIn = status === "authenticated"

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="container mx-auto flex h-14 items-center px-4 md:px-6 justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 py-2 w-9 px-0 md:hidden"
                        >
                            <Bars3Icon className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </button>

                        <Link href="/" className="flex items-center space-x-2">
                            <span className="font-display font-medium text-xl text-primary font-black tracking-tight">
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
                        <ThemeToggle />
                        {isLoggedIn ? (
                            <>
                                <Link
                                    href="/fantasy"
                                    className="bg-primary hover:bg-primary/90 text-white font-black px-3 py-2 md:px-4 rounded-lg text-[10px] md:text-xs transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center gap-2"
                                >
                                    <BoltIcon className="h-3 w-3" />
                                    <span className="hidden sm:inline">MY SQUAD</span>
                                </Link>

                                <div className="relative hidden md:block">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className={cn(
                                            "h-9 w-9 rounded-full bg-muted border flex items-center justify-center transition-all",
                                            isProfileOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/30"
                                        )}
                                    >
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    </button>

                                    {isProfileOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsProfileOpen(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-72 bg-popover border border-border rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="px-4 py-3 border-b border-border bg-muted/30">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Account User</p>
                                                    <p className="text-xs font-black text-foreground truncate">{session?.user?.email || session?.user?.name || "Member"}</p>
                                                </div>

                                                {/* Balance Display */}
                                                <div className="px-4 py-4 border-b border-border bg-gradient-to-br from-purple-600/10 to-indigo-600/10">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Lifetime Points</p>
                                                            <p className="text-2xl font-black text-foreground tracking-tighter">{points !== null ? points : "0"} pts</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Link
                                                                href="/fantasy"
                                                                onClick={() => setIsProfileOpen(false)}
                                                                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5 active:scale-95"
                                                            >
                                                                <BoltIcon className="h-3 w-3" />
                                                                Draft Lineup
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-2 space-y-1">
                                                    {session?.user?.role === "admin" && (
                                                        <Link
                                                            href="/admin"
                                                            onClick={() => setIsProfileOpen(false)}
                                                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-black bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all border border-purple-500/20 shadow-sm"
                                                        >
                                                            <ShieldExclamationIcon className="h-4 w-4 text-purple-400" /> Admin Dashboard
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href="/account/profile"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                                    >
                                                        <UserIcon className="h-4 w-4" /> My Profile
                                                    </Link>
                                                    <Link
                                                        href="/fantasy"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                                    >
                                                        <TrophyIcon className="h-4 w-4" /> My Lineup
                                                    </Link>
                                                    <Link
                                                        href="/account/settings"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                                    >
                                                        <UserIcon className="h-4 w-4" /> Settings
                                                    </Link>

                                                    <div className="h-px bg-border my-2 mx-2" />

                                                    <Link
                                                        href="/help"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                                    >
                                                        <QuestionMarkCircleIcon className="h-4 w-4" /> Help Center
                                                    </Link>
                                                    <Link
                                                        href="/how-to-play"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                                    >
                                                        <BookOpenIcon className="h-4 w-4" /> How to Play
                                                    </Link>
                                                    <a
                                                        href="https://wa.me/233276019798"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition-all font-black"
                                                    >
                                                        <ChatBubbleLeftRightIcon className="h-4 w-4" /> Support (WhatsApp)
                                                    </a>

                                                    <div className="h-px bg-border my-2 mx-2" />

                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-black text-red-400 hover:bg-red-500/10 transition-all"
                                                    >
                                                        <ArrowRightStartOnRectangleIcon className="h-4 w-4" /> SECURE LOGOUT
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/auth/login"
                                    className="text-xs md:text-sm font-black text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
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
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-popover border-r border-border shadow-2xl animate-in slide-in-from-left duration-300">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <span className="font-display font-black text-lg text-primary tracking-tight">
                                QSTAKE<span className="text-foreground">bet</span>
                            </span>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-1 hover:bg-accent rounded-full"
                            >
                                <XMarkIcon className="h-5 w-5 text-muted-foreground" />
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
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
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

                            {isLoggedIn && (
                                <div className="pt-4 border-t border-border mt-4 space-y-2">
                                    <Link
                                        href="/account/profile"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                    >
                                        <UserIcon className="h-4 w-4" /> My Profile
                                    </Link>
                                    <Link
                                        href="/fantasy"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                    >
                                        <TrophyIcon className="h-4 w-4" /> My Lineup
                                    </Link>
                                    <Link
                                        href="/how-to-play"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                    >
                                        <BookOpenIcon className="h-4 w-4" /> How to Play
                                    </Link>
                                    <a
                                        href="https://wa.me/233276019798"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                    >
                                        <ChatBubbleLeftRightIcon className="h-4 w-4" /> Support (WhatsApp)
                                    </a>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-red-500 hover:bg-red-500/10 transition-all"
                                    >
                                        <ArrowRightStartOnRectangleIcon className="h-4 w-4" /> LOGOUT
                                    </button>
                                </div>
                            )}

                            {!isLoggedIn && (
                                <div className="pt-8 space-y-3">
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="w-full flex items-center justify-center font-black py-4 rounded-2xl border border-border text-foreground hover:bg-accent transition-all text-sm"
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
            {/* Logout Confirmation Modal */}
            {isLogoutConfirmOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsLogoutConfirmOpen(false)}
                    />
                    <div className="relative bg-popover border border-border rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="p-4 bg-red-500/10 rounded-2xl">
                                <ArrowRightStartOnRectangleIcon className="h-8 w-8 text-red-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Confirm Logout</h3>
                                <p className="text-muted-foreground font-medium">Are you sure you want to end your session?</p>
                            </div>
                            <div className="w-full flex flex-col gap-3">
                                <button
                                    onClick={confirmLogout}
                                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-500/20"
                                >
                                    YES, LOGOUT
                                </button>
                                <button
                                    onClick={() => setIsLogoutConfirmOpen(false)}
                                    className="w-full py-4 bg-muted hover:bg-muted/70 text-foreground font-bold rounded-2xl transition-all border border-border"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
