"use client"

import React from "react"
import { Gavel, Scale, AlertOctagon, Heart, HelpCircle, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-2xl mb-6">
                        <Gavel className="h-10 w-10 text-purple-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Terms & <span className="text-purple-500">Conditions</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em]">
                        Last Updated: February 22, 2026
                    </p>
                </div>

                {/* Main Content Card */}
                <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl">
                    <p className="text-lg text-slate-400 mb-10 leading-relaxed italic">
                        These Terms and Conditions (“Terms”) govern the use of the QSTAKEbet platform (“Platform”, “Service”, “we”, “us”, “our”). By accessing or using QSTAKEbet, you agree to be legally bound by these Terms.
                    </p>

                    <div className="space-y-12">
                        {/* 1. ELIGIBILITY */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Scale className="h-5 w-5 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">1. Eligibility</h2>
                            </div>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>1.1 You must be <strong className="text-white">eighteen (18) years or older</strong> to register and participate in betting activities on QSTAKEbet.</p>
                                <p>1.2 By using this Platform, you confirm that:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>You are legally permitted to participate in betting activities under the laws of the <strong className="text-white">Republic of Ghana</strong>.</li>
                                    <li>You are acting on your own behalf and not on behalf of another person or entity.</li>
                                </ul>
                                <p>1.3 QSTAKEbet reserves the right to verify your age and identity at any time.</p>
                            </div>
                        </section>

                        {/* 2. ACCOUNT REGISTRATION */}
                        <section>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">2. Account Registration and Use</h2>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>2.1 Only <strong className="text-white">one account per individual</strong> is permitted.</p>
                                <p>2.2 You are responsible for maintaining the confidentiality of your login credentials.</p>
                                <p>2.3 QSTAKEbet may suspend or permanently close accounts that provide false information, engage in fraudulent behavior, or violate these Terms.</p>
                                <p>2.4 Account balances are <strong className="text-white">non-transferable</strong>.</p>
                            </div>
                        </section>

                        {/* 3. DEPOSITS */}
                        <section>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">3. Deposits</h2>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>3.1 Deposits are credited to your account only after confirmation from our approved payment providers (e.g., Moolre, Paystack).</p>
                                <p>3.2 Minimum and maximum deposit limits apply and may vary by payment method.</p>
                                <p>3.3 Deposited funds may be subject to <strong className="text-white">minimum wagering requirements</strong> before withdrawal to prevent money laundering.</p>
                            </div>
                        </section>

                        {/* 4. BETTING RULES */}
                        <section>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">4. Betting Rules</h2>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>4.1 All bets are <strong className="text-white">final and irreversible</strong> once confirmed.</p>
                                <p>4.2 Odds displayed are subject to change prior to bet confirmation.</p>
                                <p>4.3 QSTAKEbet reserves the right to suspend markets, void bets placed in error, or adjust odds to correct obvious mistakes.</p>
                                <p>4.4 Virtual games and real sporting events are governed by separate settlement rules.</p>
                            </div>
                        </section>

                        {/* 5. BONUSES */}
                        <section>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">5. Bonuses and Promotions</h2>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>5.1 Bonuses are subject to specific terms, including wagering (turnover) requirements.</p>
                                <p>5.2 Bonus funds and winnings derived from bonuses <strong className="text-white">cannot be withdrawn</strong> until requirements are met.</p>
                                <p>5.3 QSTAKEbet reserves the right to modify, withdraw, or cancel bonuses in cases of suspected abuse.</p>
                            </div>
                        </section>

                        {/* 6. WITHDRAWALS */}
                        <section>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">6. Withdrawals</h2>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>6.1 Withdrawal requests are subject to identity verification, completion of wagering requirements, and anti-fraud checks.</p>
                                <p>6.2 Daily and per-transaction withdrawal limits apply.</p>
                                <p>6.3 QSTAKEbet may delay withdrawals for security, regulatory, or operational reasons.</p>
                            </div>
                        </section>

                        {/* 7. RISK MANAGEMENT */}
                        <section>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">7. Risk Management</h2>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>7.1 QSTAKEbet reserves the right to limit stakes, cap maximum winnings, or lock markets to manage financial risk.</p>
                                <p>7.2 Maximum payout limits apply to all bets, regardless of the odds or stake.</p>
                            </div>
                        </section>

                        <div className="border-t border-white/5 pt-12 space-y-12">
                            {/* RESPONSIBLE GAMING */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-pink-500/10 rounded-lg">
                                        <Heart className="h-5 w-5 text-pink-400" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Responsible Gaming</h2>
                                </div>
                                <p className="text-slate-400 leading-relaxed">
                                    QSTAKEbet promotes responsible betting. Users may request deposit limits, betting limits, or account self-exclusion at any time. Betting should be for entertainment; if it becomes a problem, please seek professional help.
                                </p>
                            </section>

                            {/* AML / KYC */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <ShieldCheck className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">AML / KYC Policy</h2>
                                </div>
                                <p className="text-slate-400 leading-relaxed">
                                    In compliance with international Anti-Money Laundering (AML) standards, we require identity verification (Know Your Customer) for high-value transactions and withdrawals. We reserve the right to report suspicious activity to the relevant Ghanaian authorities.
                                </p>
                            </section>

                            {/* DISPUTE RESOLUTION */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                                        <HelpCircle className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Disputes</h2>
                                </div>
                                <p className="text-slate-400 leading-relaxed">
                                    Any complaints or disputes regarding bets or payouts must be raised within 7 days of the event. All disputes are governed by and construed in accordance with the laws of the <strong className="text-white">Republic of Ghana</strong>.
                                </p>
                            </section>
                        </div>
                    </div>

                    {/* Footer Nav */}
                    <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
                        <Link href="/privacy" className="text-purple-400 hover:text-white font-bold transition-all uppercase tracking-widest text-xs">
                            Read Privacy Policy
                        </Link>
                        <Link href="/" className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all text-xs uppercase tracking-widest">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
