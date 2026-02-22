"use client"

import React from "react"
import { Shield, Eye, Lock, FileText, UserCheck, Cookie, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl mb-6">
                        <Lock className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Privacy <span className="text-emerald-500">Policy</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em]">
                        Last Updated: February 22, 2026
                    </p>
                </div>

                {/* Main Content Card */}
                <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl">
                    <p className="text-lg text-slate-400 mb-10 leading-relaxed italic">
                        This Privacy Policy explains how QSTAKEbet collects, uses, and protects personal data in compliance with the <strong className="text-emerald-500 italic">Data Protection Act, 2012 (Act 843) of Ghana</strong>.
                    </p>

                    <div className="space-y-12">
                        {/* 1. INFORMATION COLLECTED */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Eye className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">1. Information Collected</h2>
                            </div>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>We may collect and process following types of data:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong className="text-white">Personal identification data</strong>: Name, phone number, and email address provided during registration.</li>
                                    <li><strong className="text-white">Transaction data</strong>: Records of your deposits, withdrawals, bets, and payment methods (via secure providers).</li>
                                    <li><strong className="text-white">Technical data</strong>: Your IP address, device type, browser settings, and platform usage patterns.</li>
                                </ul>
                            </div>
                        </section>

                        {/* 2. PURPOSE */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <FileText className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">2. Purpose of Data Collection</h2>
                            </div>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>Your data is used strictly to:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Operate and manage your user account.</li>
                                    <li>Process payments, bets, and payouts efficiently.</li>
                                    <li>Prevent fraud, money laundering, and unauthorized access.</li>
                                    <li>Meet legal and regulatory obligations as required by Ghanaian law.</li>
                                </ul>
                            </div>
                        </section>

                        {/* 3. DATA SECURITY */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Shield className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">3. Data Security</h2>
                            </div>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>3.1 We implement robust technical and organizational measures (including encryption) to protect your personal data against unauthorized access, alteration, or disclosure.</p>
                                <p>3.2 Access to user data is restricted to authorized personnel only, strictly on a need-to-know basis.</p>
                            </div>
                        </section>

                        {/* 4. DATA SHARING */}
                        <section>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">4. Data Sharing</h2>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>4.1 QSTAKEbet <strong className="text-white">does not sell or rent</strong> your personal data to third parties.</p>
                                <p>4.2 Data may be shared with licensed payment providers (Moolre, Paystack) to facilitate transactions or with regulatory authorities where required by law.</p>
                            </div>
                        </section>

                        {/* 5. COOKIES */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Cookie className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">5. Cookies</h2>
                            </div>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>5.1 We use cookies to maintain your login session and enhance your user experience (e.g., remembering your preferences).</p>
                                <p>5.2 Disabling cookies in your browser may significantly affect the platform&apos;s functionality.</p>
                            </div>
                        </section>

                        {/* 6. USER RIGHTS */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <UserCheck className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">6. User Rights</h2>
                            </div>
                            <div className="space-y-4 text-slate-400 leading-relaxed">
                                <p>Under the Data Protection Act (2012), you have the right to:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Access the personal data we hold about you.</li>
                                    <li>Request correction of any inaccuracies in your record.</li>
                                    <li>Request deletion of your data, subject to our legal and regulatory retention obligations.</li>
                                </ul>
                            </div>
                        </section>

                        {/* 7. RETENTION */}
                        <section>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">7. Data Retention</h2>
                            <p className="text-slate-400 leading-relaxed">
                                Data is retained only as long as necessary for legal compliance, fraud prevention, and operational excellence. If you close your account, we may still retain certain data as required by the Gaming Commission of Ghana or for audit purposes.
                            </p>
                        </section>
                    </div>

                    {/* Footer Nav */}
                    <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
                        <Link href="/terms" className="flex items-center gap-2 text-emerald-500 hover:text-white font-bold transition-all uppercase tracking-widest text-xs">
                            <ArrowLeft className="h-3 w-3" /> Read Terms & Conditions
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
