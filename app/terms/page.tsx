"use client"

import React from "react"
import { AcademicCapIcon as Cap, ScaleIcon as Scale, ShieldCheckIcon as ShieldCheck, HeartIcon as Heart, QuestionMarkCircleIcon as HelpCircle, ExclamationTriangleIcon as AlertTriangle } from "@heroicons/react/24/solid";
import Link from "next/link"

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background text-foreground/80 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
                        <Cap className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground uppercase tracking-tighter mb-4">
                        Terms & <span className="text-primary">Conditions</span>
                    </h1>
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-[0.2em]">
                        Last Updated: August 23, 2026
                    </p>
                </div>

                {/* Main Content Card */}
                <div className="bg-card/40 border border-border/50 rounded-[2rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl">
                    <p className="text-lg text-muted-foreground mb-10 leading-relaxed italic">
                        These Terms and Conditions (&ldquo;Terms&rdquo;) govern the use of the QSTAKEbet platform (&ldquo;Platform&rdquo;, &ldquo;Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By accessing or using QSTAKEbet, you agree to be legally bound by these Terms. QSTAKEbet is a <strong className="text-foreground">free-to-play fantasy game</strong> built around the National Science &amp; Maths Quiz (NSMQ). It is <strong className="text-foreground">not a betting or gambling service</strong>: no real-money wagers, deposits, or cash payouts exist on this Platform.
                    </p>

                    <div className="space-y-12">
                        {/* 1. ABOUT THE PLATFORM */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Cap className="h-5 w-5 text-primary" />
                                </div>
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">1. About the Platform</h2>
                            </div>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>1.1 QSTAKEbet lets users build fantasy squads of NSMQ-participating schools, follow contest results, and earn fantasy points based on real NSMQ performance.</p>
                                <p>1.2 All points, rankings, and leaderboard positions are <strong className="text-foreground">for entertainment and bragging rights only</strong>. They have no monetary value and cannot be bought, sold, transferred, or exchanged for cash or prizes.</p>
                                <p>1.3 The Platform is not affiliated with, endorsed by, or officially connected to the National Science &amp; Maths Quiz, Primetime Limited, or any participating school.</p>
                            </div>
                        </section>

                        {/* 2. ELIGIBILITY */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Scale className="h-5 w-5 text-blue-400" />
                                </div>
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">2. Eligibility</h2>
                            </div>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>2.1 The Platform is open to anyone with a valid Ghanaian phone number and email address.</p>
                                <p>2.2 If you are under 18 years old, you should use the Platform only with the knowledge and consent of a parent or guardian.</p>
                                <p>2.3 You must comply with all applicable laws of the Republic of Ghana when using the Platform.</p>
                            </div>
                        </section>

                        {/* 3. ACCOUNT REGISTRATION */}
                        <section>
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-4">3. Account Registration and Use</h2>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>3.1 Only <strong className="text-foreground">one account per individual</strong> is permitted.</p>
                                <p>3.2 You agree to provide accurate registration information (name, email, phone number) and to keep your login credentials confidential.</p>
                                <p>3.3 By registering, you consent to receive service messages from us, for example, a one-time SMS welcome message confirming account creation. We do not send marketing SMS without your separate consent.</p>
                                <p>3.4 QSTAKEbet may suspend or permanently close accounts that provide false information, engage in fraudulent behavior, or violate these Terms.</p>
                            </div>
                        </section>

                        {/* 4. FANTASY GAMEPLAY */}
                        <section>
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-4">4. Fantasy Gameplay and Scoring</h2>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>4.1 Users draft squads of schools for specific matchdays within published lockout windows. Squads are locked once a matchday begins.</p>
                                <p>4.2 Fantasy points are awarded based on official NSMQ contest results as recorded by the Platform, using the scoring rules displayed in the app.</p>
                                <p>4.3 Scoring rules may be adjusted between matchdays. Any change will be applied prospectively and will not retroactively alter settled matchdays except to correct a demonstrable error.</p>
                                <p>4.4 Where an official result is later corrected or revised, the Platform reserves the right to recompute affected scores.</p>
                            </div>
                        </section>

                        {/* 5. FAIR PLAY */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-pink-500/10 rounded-lg">
                                    <Heart className="h-5 w-5 text-pink-400" />
                                </div>
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">5. Fair Play</h2>
                            </div>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>5.1 You must not create multiple accounts, use automation, bots, scripts, or scraping tools, or otherwise attempt to manipulate leaderboards, referrals, or scoring.</p>
                                <p>5.2 Referral rewards are intended for genuinely new users. Coordinated or fraudulent referral activity may result in removal of referral bonuses and account suspension.</p>
                            </div>
                        </section>

                        {/* 6. NO GAMBLING */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                </div>
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">6. No Gambling, No Wagering</h2>
                            </div>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>6.1 The Platform does not accept stakes, bets, deposits, or wagers of any kind. Nothing on the Platform may be construed as gambling, betting, or lottery activity under Ghanaian law.</p>
                                <p>6.2 Any legacy references to staking or betting in older materials are superseded by these Terms.</p>
                            </div>
                        </section>

                        <div className="border-t border-border/50 pt-12 space-y-12">
                            {/* AVAILABILITY */}
                            <section>
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-4">7. Availability and Changes</h2>
                                <div className="space-y-4 text-muted-foreground leading-relaxed">
                                    <p>7.1 The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do not guarantee uninterrupted access and may modify or discontinue features at any time.</p>
                                    <p>7.2 We may update these Terms from time to time. Continued use of the Platform after changes are posted constitutes acceptance of the updated Terms.</p>
                                </div>
                            </section>

                            {/* LIMITATION OF LIABILITY */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-red-500/10 rounded-lg">
                                        <ShieldCheck className="h-5 w-5 text-red-400" />
                                    </div>
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">8. Limitation of Liability</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    To the maximum extent permitted by law, QSTAKEbet shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform, including data errors, downtime, or loss of fantasy points.
                                </p>
                            </section>

                            {/* DISPUTE RESOLUTION */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                                        <HelpCircle className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">9. Disputes and Governing Law</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    Any complaints or disputes regarding accounts, scores, or leaderboards should be raised through our support channels. These Terms are governed by and construed in accordance with the laws of the <strong className="text-foreground">Republic of Ghana</strong>.
                                </p>
                            </section>
                        </div>
                    </div>

                    {/* Footer Nav */}
                    <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-border/50 pt-8">
                        <Link href="/privacy" className="text-primary hover:text-foreground font-bold transition-standard uppercase tracking-widest text-xs">
                            Read Privacy Policy
                        </Link>
                        <Link href="/" className="px-8 py-3 bg-accent/5 hover:bg-accent/10 border border-border rounded-xl text-foreground font-bold transition-standard text-xs uppercase tracking-widest">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
