import { Shield, Lock, Eye, FileText } from "lucide-react"

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                        <Lock className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-3">Privacy Policy</h1>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Last updated: February 2026</p>
                </div>

                {/* Content */}
                <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 md:p-12 space-y-8">

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Eye className="h-5 w-5 text-emerald-500" />
                            1. Information We Collect
                        </h2>
                        <div className="text-slate-400 leading-relaxed space-y-4">
                            <p>We collect information you provide directly to us, such as when you create an account, make a deposit, place a bet, or request customer support. This information may include:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Name, email address, and phone number</li>
                                <li>Payment information and transaction history</li>
                                <li>Login credentials</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-500" />
                            2. How We Use Your Information
                        </h2>
                        <div className="text-slate-400 leading-relaxed space-y-4">
                            <p>We use the information we collect to:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Provide, maintain, and improve our services</li>
                                <li>Process your transactions and bets</li>
                                <li>Send you technical notices, updates, and support messages</li>
                                <li>Detect and prevent fraud and authorized use</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            3. Data Security
                        </h2>
                        <div className="text-slate-400 leading-relaxed">
                            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee the absolute security of your data.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Contact Us</h2>
                        <p className="text-slate-400 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us via our Support channels.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    )
}
