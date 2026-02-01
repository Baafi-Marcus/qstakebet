"use client"

import { useSession } from "next-auth/react"
import { Mail, Phone, User, Shield } from "lucide-react"

export default function ProfilePage() {
    const { data: session } = useSession()

    const userInfo = [
        { label: "Full Name", value: session?.user?.name || "Not provided", icon: User },
        { label: "Email Address", value: session?.user?.email || "Not provided", icon: Mail },
        { label: "Phone Number", value: "Not provided", icon: Phone },
        { label: "Account ID", value: session?.user?.id || "---", icon: Shield },
    ]

    return (
        <div className="max-w-4xl">
            <div className="mb-12">
                <h2 className="text-4xl font-black mb-2 tracking-tight">Your Account</h2>
                <p className="text-slate-400 font-medium">Manage your personal information and security settings.</p>
            </div>

            <div className="space-y-10">
                {/* Info List */}
                <div className="space-y-8">
                    {userInfo.map((info) => (
                        <div key={info.label} className="flex items-start gap-6 group">
                            <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all">
                                <info.icon className="h-6 w-6 text-slate-400 group-hover:text-purple-400 transition-colors" />
                            </div>
                            <div className="flex-1 border-b border-white/5 pb-6 group-last:border-0">
                                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1 block">{info.label}</span>
                                <p className="text-xl font-bold text-white tracking-tight">{info.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <button className="bg-slate-800 hover:bg-slate-700 border border-white/5 text-white font-bold py-5 px-8 rounded-2xl transition-all text-sm uppercase tracking-widest">
                        Change Password
                    </button>
                    <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 px-8 rounded-2xl transition-all text-sm uppercase tracking-widest shadow-lg shadow-purple-500/20">
                        Edit Profile
                    </button>
                </div>

                {/* Verification Banner - Keeping it visually distinct but integrated */}
                <div className="relative overflow-hidden p-8 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-[2.5rem] border border-white/5 mt-8">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-md">
                            <div className="flex items-center gap-3 mb-3">
                                <Shield className="h-5 w-5 text-purple-400" />
                                <h3 className="text-xl font-black uppercase tracking-tight">Account Verification</h3>
                            </div>
                            <p className="text-slate-400 font-medium leading-relaxed text-sm">
                                Complete your identity verification to unlock higher withdrawal limits and premium betting features.
                            </p>
                        </div>
                        <button className="bg-white text-slate-950 font-black py-4 px-10 rounded-2xl transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest">
                            Verify Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
