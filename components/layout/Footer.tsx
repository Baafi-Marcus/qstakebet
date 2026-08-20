"use client"

import Link from "next/link"
import { QuestionMarkCircleIcon as HelpCircle, BookOpenIcon as BookOpen, CheckBadgeIcon as Award, ChatBubbleLeftRightIcon as MessageSquare, BoltIcon as Zap, ShieldCheckIcon as Shield } from "@heroicons/react/24/solid";
import { Twitter, Facebook, Instagram } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-background border-t border-border pt-16 pb-12 px-4">
            <div className="max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="font-display font-black text-2xl text-primary tracking-tight">
                                QSTAKE<span className="text-foreground">fantasy</span>
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-xs">
                            Step into the future of academic pride. Ghana&apos;s premier fantasy draft and alumni fan community for the National Science & Maths Quiz (NSMQ).
                        </p>
                        <div className="flex items-center gap-3">
                            <button className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all text-muted-foreground">
                                <Twitter className="h-4 w-4" />
                            </button>
                            <button className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all text-muted-foreground">
                                <Facebook className="h-4 w-4" />
                            </button>
                            <button className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all text-muted-foreground">
                                <Instagram className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Platforms */}
                    <div>
                        <h3 className="text-foreground font-black uppercase text-[10px] tracking-[0.25em] mb-6 opacity-50">Ecosystem</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/fantasy" className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors flex items-center gap-2">
                                    <Zap className="h-4 w-4 opacity-50" /> Fantasy Draft
                                </Link>
                            </li>
                            <li>
                                <Link href="/chat" className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 opacity-50" /> Banter Rooms
                                </Link>
                            </li>
                            <li>
                                <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors flex items-center gap-2">
                                    <Award className="h-4 w-4 opacity-50" /> National Rankings
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors flex items-center gap-2">
                                    <Shield className="h-4 w-4 opacity-50" /> Quiz Schedules
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-foreground font-black uppercase text-[10px] tracking-[0.25em] mb-6 opacity-50">Support</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/help" className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 opacity-50" /> Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/how-to-play" className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 opacity-50" /> How to Play
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-foreground font-black uppercase text-[10px] tracking-[0.25em] mb-6 opacity-50">Legal & Privacy</h3>
                        <ul className="space-y-4">
                            <li><Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors uppercase text-[11px] tracking-wider">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors uppercase text-[11px] tracking-wider">Privacy Policy</Link></li>
                            <li><Link href="/cookies" className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors uppercase text-[11px] tracking-wider">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-border flex flex-col items-center text-center space-y-4">
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
                        © 2026 QSTAKE. All Rights Reserved.
                    </p>
                    <p className="max-w-2xl text-[9px] text-muted-foreground font-bold uppercase leading-relaxed tracking-widest opacity-60">
                        QSTAKE is a free-to-play fan ecosystem for entertainment purposes. It is not affiliated with, sponsored by, or endorsed by Primetime Limited, organizers of the National Science & Maths Quiz.
                    </p>
                </div>
            </div>
        </footer>
    )
}
