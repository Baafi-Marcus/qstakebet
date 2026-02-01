"use client"

import React from "react"
import Link from "next/link"
import { ShieldCheck, LogOut, Bell, User, Settings } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

export function AdminHeader() {
    const { data: session } = useSession()

    return (
        <header className="h-[70px] bg-slate-950 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-xs font-black text-white uppercase tracking-widest mt-0.5">Admin Console</span>
                </div>
                <div className="h-4 w-px bg-white/10 mx-2" />
                <Link href="/" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors">
                    Visit Main Site
                </Link>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                    <Bell className="h-5 w-5" />
                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-slate-950" />
                </button>

                <div className="h-6 w-px bg-white/10" />

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xs font-black text-white uppercase tracking-tight">{session?.user?.name || "Administrator"}</div>
                        <div className="text-[9px] font-bold text-primary uppercase tracking-widest">Master Access</div>
                    </div>
                    <div className="relative group">
                        <button className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:border-primary/50 transition-all">
                            <User className="h-5 w-5" />
                        </button>

                        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl">
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5 hover:text-white rounded-xl transition-colors">
                                <Settings className="h-4 w-4" />
                                Settings
                            </button>
                            <div className="h-px bg-white/5 my-2" />
                            <button
                                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                                className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Terminate Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
