import { BookOpen, Trophy, Zap, Target, CheckCircle, Users } from "lucide-react"

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
                    <p className="text-slate-400 text-lg font-medium">Your complete guide to QSTAKEbet Fantasy and Predictions</p>
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
                                <p className="text-slate-400 mb-3">Sign up with your email and create a secure password. Verify your account to get started on the leaderboard!</p>
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
                                <h3 className="text-xl font-black text-white uppercase mb-2">Build Your Fantasy Squad</h3>
                                <p className="text-slate-400 mb-3">Go to the <strong className="text-white">Fantasy</strong> page to assemble your dream team. Pick schools based on their tier, stick to your budget, and choose a captain for double points!</p>
                                <div className="flex items-center gap-2 text-sm text-emerald-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-bold">Score based on real performance</span>
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
                                <h3 className="text-xl font-black text-white uppercase mb-2">Predict Match Outcomes</h3>
                                <p className="text-slate-400 mb-3">Explore upcoming matches in the tournaments. Make predictions on who will win or what the score margins will be.</p>
                                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-4 mt-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Prediction Tips:</p>
                                    <ul className="space-y-2 text-sm text-slate-300">
                                        <li className="flex items-start gap-2">
                                            <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-white">Research:</strong> Look at historical matchups and recent performance.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-white">Climb the Ranks:</strong> The more accurate your predictions, the more lifetime points you earn!</span>
                                        </li>
                                    </ul>
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
                                <h3 className="text-xl font-black text-white uppercase mb-2">Join the Community Banter</h3>
                                <p className="text-slate-400 mb-3">Head over to the <strong className="text-white">Chat Rooms</strong>. Rep your school, banter with alumni, and discuss live tournaments as they happen.</p>
                                <div className="flex items-center gap-2 text-sm text-emerald-400">
                                    <Users className="h-4 w-4" />
                                    <span className="font-bold">Real-time Fan Community</span>
                                </div>
                            </div>
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
