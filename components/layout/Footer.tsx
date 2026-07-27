"use client"

import Link from "next/link"
import { HelpCircle, BookOpen, Twitter, Facebook, Instagram, Award, MessageSquare, Zap, Shield } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-white/5 pt-16 pb-12 px-4">
            <div className="max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="font-display font-black text-2xl text-primary tracking-tight">
                                QSTAKE<span className="text-white">fantasy</span>
                            </span>
                        </Link>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
                            Step into the future of academic pride. Ghana&apos;s premier fantasy draft and alumni fan community for the National Science & Maths Quiz (NSMQ).
                        </p>
                        <div className="flex items-center gap-3">
                            <button className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all text-slate-400">
                                <Twitter className="h-4 w-4" />
                            </button>
                            <button className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all text-slate-400">
                                <Facebook className="h-4 w-4" />
                            </button>
                            <button className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all text-slate-400">
                                <Instagram className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Platforms */}
                    <div>
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.25em] mb-6 opacity-50">Ecosystem</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/fantasy" className="text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center gap-2">
                                    <Zap className="h-4 w-4 opacity-50" /> Fantasy Draft
                                </Link>
                            </li>
                            <li>
                                <Link href="/chat" className="text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 opacity-50" /> Banter Rooms
                                </Link>
                            </li>
                            <li>
                                <Link href="/leaderboard" className="text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center gap-2">
                                    <Award className="h-4 w-4 opacity-50" /> National Rankings
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center gap-2">
                                    <Shield className="h-4 w-4 opacity-50" /> Quiz Schedules
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.25em] mb-6 opacity-50">Support</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/help" className="text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 opacity-50" /> Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/how-to-play" className="text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 opacity-50" /> How to Play
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.25em] mb-6 opacity-50">Legal & Privacy</h3>
                        <ul className="space-y-4">
                            <li><Link href="/terms" className="text-slate-400 hover:text-white text-sm font-bold transition-colors uppercase text-[11px] tracking-wider">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="text-slate-400 hover:text-white text-sm font-bold transition-colors uppercase text-[11px] tracking-wider">Privacy Policy</Link></li>
                            <li><Link href="/cookies" className="text-slate-400 hover:text-white text-sm font-bold transition-colors uppercase text-[11px] tracking-wider">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center text-center space-y-4">
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
                        © 2026 QSTAKE. All Rights Reserved.
                    </p>
                    <p className="max-w-2xl text-[9px] text-slate-700 font-bold uppercase leading-relaxed tracking-widest">
                        QSTAKE is a free-to-play fan ecosystem for entertainment purposes. It is not affiliated with, sponsored by, or endorsed by Primetime Limited, organizers of the National Science & Maths Quiz.
                    </p>
                </div>
            </div>
        </footer>
    )
}
