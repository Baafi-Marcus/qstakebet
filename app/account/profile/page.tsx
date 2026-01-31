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
        <div className="space-y-12">
            <div>
                <h2 className="text-3xl font-black mb-2">Profile Information</h2>
                <p className="text-slate-400 font-medium">Update your account details and security settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {userInfo.map((info) => (
                    <div key={info.label} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-2xl">
                                <info.icon className="h-6 w-6 text-purple-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-slate-400 font-bold text-sm uppercase tracking-wider">{info.label}</span>
                        </div>
                        <p className="text-xl font-bold text-white pl-1">{info.value}</p>
                    </div>
                ))}
            </div>

            <div className="pt-8 border-t border-white/5">
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-8 rounded-2xl transition-all">
                    Change Password
                </button>
            </div>

            <div className="p-8 bg-purple-500/5 rounded-[2.5rem] border border-purple-500/10">
                <div className="flex items-center gap-4 mb-4">
                    <Shield className="h-6 w-6 text-purple-400" />
                    <h3 className="text-xl font-bold">Account Verification</h3>
                </div>
                <p className="text-slate-400 mb-6 font-medium leading-relaxed">
                    Verify your account to increase your withdrawal limits and participate in exclusive high-stake tournaments.
                </p>
                <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/20">
                    Verify Now
                </button>
            </div>
        </div>
    )
}
