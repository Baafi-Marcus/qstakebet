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

            <div className="space-y-12">
                {/* Info List - Flat Design */}
                <div className="border-t border-white/10">
                    {userInfo.map((info) => (
                        <div key={info.label} className="flex items-center gap-6 py-6 border-b border-white/10 group">
                            <div className="p-0">
                                <info.icon className="h-5 w-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                            </div>
                            <div className="flex-1">
                                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1 block">{info.label}</span>
                                <p className="text-lg font-bold text-white tracking-tight">{info.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button className="flex-1 bg-transparent hover:bg-white/5 border border-white/10 text-white font-bold py-4 px-8 rounded-lg transition-all text-sm uppercase tracking-widest">
                        Change Password
                    </button>
                    <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-8 rounded-lg transition-all text-sm uppercase tracking-widest">
                        Edit Profile
                    </button>
                </div>

                {/* Verification Section - Minimalist */}
                <div className="flex items-start gap-4 p-0">
                    <Shield className="h-5 w-5 text-purple-500 mt-1" />
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-white mb-1">Account Verification</h3>
                        <p className="text-slate-400 text-sm mb-4 max-w-xl">
                            Complete your identity verification to unlock higher withdrawal limits and premium betting features.
                        </p>
                        <button className="text-purple-400 font-black text-xs uppercase tracking-widest hover:text-purple-300 transition-colors">
                            Verify Identity &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
