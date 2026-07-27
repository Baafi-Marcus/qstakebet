"use client"

import { HelpCircle, MessageSquare, Mail, Phone } from "lucide-react"
import Link from "next/link"

export default function HelpCenterPage() {
    const faqs = [
        {
            question: "How do I start playing?",
            answer: "Since we've transitioned to a pure Fantasy and Prediction platform, there are no real-money deposits required. Just create an account and start playing!"
        },
        {
            question: "How do I predict matches?",
            answer: "Go to the 'Predictions' tab, select the match you want to predict, and enter your predicted outcome."
        },
        {
            question: "How are Fantasy points calculated?",
            answer: "Points are awarded based on real-life NSMQ performance. Correct answers, speed, and overall performance in the tournament all contribute to your squad's total score."
        },
        {
            question: "Is there a limit on how many predictions I can make?",
            answer: "You can make one prediction per match."
        },
        {
            question: "How do I verify my phone number?",
            answer: "During registration, you'll receive an OTP code via SMS. Enter this code to verify your phone number. You can update your phone number in Settings."
        }
    ]

    return (
        <div className="min-h-screen bg-[#0f1115] text-white pb-20">
            <main className="container max-w-4xl mx-auto px-4 pt-12">
                <div className="space-y-12">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-4 bg-purple-500/10 rounded-2xl mb-4">
                            <HelpCircle className="h-12 w-12 text-purple-400" />
                        </div>
                        <h1 className="text-4xl font-black">Help Center</h1>
                        <p className="text-slate-400 font-medium text-lg">Find answers to common questions</p>
                    </div>

                    {/* FAQs */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black mb-6">Frequently Asked Questions</h2>
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-3">
                                <h3 className="text-lg font-black text-white">{faq.question}</h3>
                                <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                            </div>
                        ))}
                    </div>

                    {/* Contact Support */}
                    <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-3xl p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black">Still Need Help?</h2>
                            <p className="text-slate-400">Our support team is here to assist you</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <a
                                href="https://wa.me/233276019798"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-xl transition-all group"
                            >
                                <MessageSquare className="h-6 w-6 text-emerald-400" />
                                <div>
                                    <p className="font-black text-white">WhatsApp Support</p>
                                    <p className="text-xs text-emerald-400">Chat with us now</p>
                                </div>
                            </a>

                            <a
                                href="tel:+233276019798"
                                className="flex items-center gap-4 p-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl transition-all group"
                            >
                                <Phone className="h-6 w-6 text-blue-400" />
                                <div>
                                    <p className="font-black text-white">Call Us</p>
                                    <p className="text-xs text-blue-400">+233 27 601 9798</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Additional Resources */}
                    <div className="text-center space-y-4">
                        <p className="text-slate-500 text-sm">Looking for more information?</p>
                        <Link
                            href="/how-to-play"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
                        >
                            Learn How to Play
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
