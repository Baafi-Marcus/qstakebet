"use client"

import { useState, useEffect } from "react"
import { EyeIcon as Eye, EyeSlashIcon as EyeOff, Cog6ToothIcon as Settings, ChevronRightIcon as ChevronRight, GiftIcon as Gift, ArrowPathIcon as Loader2, ArrowRightStartOnRectangleIcon as LogOut, QuestionMarkCircleIcon as HelpCircle, BookOpenIcon as BookOpen, ChatBubbleLeftRightIcon as MessageSquare, TrophyIcon as Trophy, BoltIcon as Zap } from "@heroicons/react/24/solid";
import { WalletIcon as Wallet, ArrowsRightLeftIcon as ArrowRightLeft, ArrowUpCircleIcon as ArrowUpFromLine } from "@heroicons/react/24/solid";
import { getUserProfileSummary } from "@/lib/user-actions"
import Link from "next/link"

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [points, setPoints] = useState<number | null>(null)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = () => {
        setIsLoggingOut(true)
        import("next-auth/react").then(m => m.signOut({ callbackUrl: "/" }))
    }

    useEffect(() => {
        getUserProfileSummary().then((res: any) => {
            if (res.success) setData(res)
            setLoading(false)
        })
        import("@/lib/fantasy-actions").then(m => m.getUserFantasyStats()).then(res => {
            if (res.success) setPoints(res.totalFantasyPoints ?? 0)
        })
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
    )

    if (!data) return <div className="p-8 text-center text-muted-foreground">Failed to load profile.</div>

    const { user } = data

    return (
        <div className="max-w-md mx-auto bg-card text-foreground min-h-[500px] rounded-3xl overflow-hidden shadow-2xl">
            {/* Header Section */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <Link href="/account/settings" className="flex items-center gap-3 group">
                        <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                            {user.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                                    {user.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold tracking-tight leading-tight">{user.name}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user.phone || user.email}</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                    </Link>
                    <Link href="/account/settings" className="p-2 hover:bg-accent rounded-full transition-colors">
                        <Settings className="h-7 w-7 text-muted-foreground" />
                    </Link>
                </div>
            </div>


            {/* Fantasy Card */}
            <div className="px-6 mb-6">
                <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lifetime Points</p>
                        <p className="text-3xl font-black text-foreground tracking-tighter">{points !== null ? points : "0"} pts</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/fantasy"
                            className="flex-1 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-2xl transition-standard hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <Zap className="h-4 w-4" />
                            Draft Lineup
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Grid */}
            <div className="bg-background rounded-t-[2.5rem] border-t border-border/50 pb-10">
                <div className="grid grid-cols-3 gap-y-8 py-8 px-2">
                    <NavButton
                        href="/leaderboard"
                        icon={Trophy}
                        label="Leaderboard"
                    />
                    <NavButton
                        href="/chat"
                        icon={MessageSquare}
                        label="Banter Rooms"
                    />

                    <NavButton
                        href="/help"
                        icon={HelpCircle}
                        label="Help Center"
                    />
                    <NavButton
                        href="/how-to-play"
                        icon={BookOpen}
                        label="How to Play"
                    />
                    <a
                        href="https://wa.me/233276019798"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-3 group px-2"
                    >
                        <div className="h-10 w-10 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 transition-colors bg-emerald-500/10 rounded-full">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-bold text-emerald-100 text-center leading-tight uppercase tracking-tight">
                            Support
                        </span>
                    </a>
                </div>

                {/* Logout Button */}
                <div className="px-6 mt-2">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-2xl transition-standard border border-red-500/10 font-black text-xs uppercase tracking-widest group disabled:opacity-60"
                    >
                        {isLoggingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LogOut className="h-4 w-4 transition-transform group-hover:rotate-12" />
                        )}
                        {isLoggingOut ? "Logging Out..." : "Log Out"}
                    </button>
                </div>
            </div>
        </div>
    )
}

function NavButton({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
    return (
        <Link href={href} className="flex flex-col items-center gap-3 group px-2">
            <div className="h-10 w-10 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                <Icon className="h-8 w-8" />
            </div>
            <span className="text-[11px] font-bold text-foreground/80 text-center leading-tight uppercase tracking-tight">
                {label}
            </span>
        </Link>
    )
}
