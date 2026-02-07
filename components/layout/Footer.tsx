"use client"

import Link from "next/link"
import { Trophy, HelpCircle, ShieldAlert, BookOpen, Twitter, Facebook, Instagram } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-white/5 pt-16 pb-8 px-4">
            <div className="max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="font-display font-black text-2xl text-primary tracking-tight">
                                QSTAKE<span className="text-white">bet</span>
                            </span>
                        </Link>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            The ultimate premium prediction platform for Sports, Virtuals, and Competitions. Experience the thrill of winning like never before.
                        </p>
                        <div className="flex items-center gap-4">
                            <button className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                                <Twitter className="h-5 w-5" />
                            </button>
                            <button className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                                <Facebook className="h-5 w-5" />
                            </button>
                            <button className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                                <Instagram className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-6">Quick Links</h3>
                        <ul className="space-y-4">
                            <li><Link href="/" className="text-slate-500 hover:text-white text-sm font-bold transition-colors">Sports Betting</Link></li>
                            <li><Link href="/live" className="text-slate-500 hover:text-white text-sm font-bold transition-colors">Live Predictions</Link></li>
                            <li><Link href="/virtuals" className="text-slate-500 hover:text-white text-sm font-bold transition-colors">Instant Virtuals</Link></li>

                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-6">Support</h3>
                        <ul className="space-y-4">
                            <li><Link href="/help" className="flex items-center gap-3 text-slate-500 hover:text-white text-sm font-bold transition-colors">
                                <HelpCircle className="h-4 w-4" /> Help Center
                            </Link></li>
                            <li><Link href="/how-to-play" className="flex items-center gap-3 text-slate-500 hover:text-white text-sm font-bold transition-colors">
                                <BookOpen className="h-4 w-4" /> How to Play
                            </Link></li>
                            <li><Link href="/terms" className="flex items-center gap-3 text-slate-500 hover:text-white text-sm font-bold transition-colors">
                                <ShieldAlert className="h-4 w-4" /> Responsible Gaming
                            </Link></li>
                        </ul>
                    </div>


                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                        © 2026 QSTAKEbet. All Rights Reserved. 18+ Only.
                    </p>
                    <div className="flex items-center gap-8">
                        <Link href="/privacy" className="text-slate-600 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="text-slate-600 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">Terms of Service</Link>
                        <Link href="/cookies" className="text-slate-600 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
