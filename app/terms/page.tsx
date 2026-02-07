import { ShieldAlert, Gavel, FileWarning, Ban } from "lucide-react"

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                        <Gavel className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-3">Terms of Service</h1>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Effective Date: February 2026</p>
                </div>

                {/* Content */}
                <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 md:p-12 space-y-8">

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FileWarning className="h-5 w-5 text-primary" />
                            1. Acceptance of Terms
                        </h2>
                        <div className="text-slate-400 leading-relaxed">
                            <p>By accessing or using QSTAKEbet, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Ban className="h-5 w-5 text-primary" />
                            2. User Eligibility
                        </h2>
                        <div className="text-slate-400 leading-relaxed space-y-4">
                            <p>You must be at least 18 years old to use our services. By using QSTAKEbet, you represent and warrant that you meet this age requirement. Underage gambling is strictly prohibited.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-primary" />
                            3. Betting Rules
                        </h2>
                        <div className="text-slate-400 leading-relaxed space-y-4">
                            <p>All bets placed on QSTAKEbet are subject to our betting rules. We reserve the right to void any bets that we suspect are fraudulent, made in error, or violate these terms.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Bets cannot be cancelled once confirmed.</li>
                                <li>Winnings are credited to your wallet automatically.</li>
                                <li>We reserve the right to limit stake amounts.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Account Termination</h2>
                        <p className="text-slate-400 leading-relaxed">
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Disclaimer</h2>
                        <p className="text-slate-400 leading-relaxed">
                            Our services are provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;. QSTAKEbet disclaims all warranties, express or implied, regarding the service.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    )
}
