import { BookOpen, Trophy, Zap, Target, CheckCircle, AlertCircle } from "lucide-react"

export default function HowToPlayPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                        <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-3">How to Play</h1>
                    <p className="text-slate-400 text-lg font-medium">Your complete guide to betting on QSTAKEbet</p>
                </div>

                {/* Steps */}
                <div className="space-y-8">
                    {/* Step 1 */}
                    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-black text-lg">1</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-white uppercase mb-2">Create Your Account</h3>
                                <p className="text-slate-400 mb-3">Sign up with your email and create a secure password. Verify your account to get started.</p>
                                <div className="flex items-center gap-2 text-sm text-emerald-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-bold">Quick & Easy Registration</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-black text-lg">2</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-white uppercase mb-2">Fund Your Wallet</h3>
                                <p className="text-slate-400 mb-3">Click the <strong className="text-white">DEPOSIT</strong> button and add funds using Mobile Money or Bank Transfer.</p>
                                <div className="flex items-center gap-2 text-sm text-emerald-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-bold">Instant Deposits via Paystack</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-black text-lg">3</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-white uppercase mb-2">Browse Matches</h3>
                                <p className="text-slate-400 mb-3">Explore upcoming matches by sport, region, or tournament. Check odds and match details.</p>
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Trophy className="h-4 w-4 text-primary" />
                                        <span className="font-bold">Sports Betting</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Zap className="h-4 w-4 text-emerald-400" />
                                        <span className="font-bold">Instant Virtuals</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-black text-lg">4</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-white uppercase mb-2">Place Your Bets</h3>
                                <p className="text-slate-400 mb-3">Click on odds to add selections to your betslip. Choose between <strong className="text-white">Singles</strong> or <strong className="text-white">Multis</strong> (accumulators).</p>
                                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-4 mt-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bet Types:</p>
                                    <ul className="space-y-2 text-sm text-slate-300">
                                        <li className="flex items-start gap-2">
                                            <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-white">Singles:</strong> Bet on individual outcomes</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-white">Multis:</strong> Combine multiple selections for higher returns (all must win)</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-black text-lg">5</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-white uppercase mb-2">Confirm & Submit</h3>
                                <p className="text-slate-400 mb-3">Enter your stake amount, review your potential returns, and click <strong className="text-white">PLACE BET</strong>.</p>
                                <div className="flex items-center gap-2 text-sm text-emerald-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-bold">Instant Bet Confirmation</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 6 */}
                    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-black text-lg">6</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-white uppercase mb-2">Track & Win</h3>
                                <p className="text-slate-400 mb-3">Monitor your bets in <strong className="text-white">My Bets</strong>. Winnings are automatically credited to your wallet!</p>
                                <div className="flex items-center gap-2 text-sm text-emerald-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-bold">Auto Settlement & Instant Payouts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="mt-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-lg font-black text-amber-500 uppercase mb-2">Important Notes</h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li>• Minimum bet amount is <strong className="text-white">GHS 1.00</strong></li>
                                <li>• You must be <strong className="text-white">18+ years old</strong> to place bets</li>
                                <li>• Odds may change before you confirm your bet</li>
                                <li>• Bet responsibly and only wager what you can afford to lose</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <p className="text-slate-400 mb-4">Need help? Our support team is here for you!</p>
                    <a
                        href="https://wa.me/233276019798"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm uppercase tracking-wider"
                    >
                        <Zap className="h-5 w-5" />
                        Contact Support on WhatsApp
                    </a>
                </div>
            </div>
        </div>
    )
}
