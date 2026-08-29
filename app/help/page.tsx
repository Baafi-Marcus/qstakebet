"use client"

import { QuestionMarkCircleIcon as HelpCircle, ChatBubbleLeftRightIcon as MessageSquare, EnvelopeIcon as Mail, PhoneIcon as Phone } from "@heroicons/react/24/solid";
import Link from "next/link"

export default function HelpCenterPage() {
    const faqs = [
        {
            question: "How do I start playing?",
            answer: "QSTAKEbet is completely free to play, with no deposits and no stakes. Create an account with your phone number and you're in!"
        },
        {
            question: "How do I draft my squad?",
            answer: "Go to the Fantasy page and pick your schools for the active matchday. Choose a captain for double points, then sit back and watch them score."
        },
        {
            question: "How are Fantasy points calculated?",
            answer: "Points are awarded based on real-life NSMQ performance. Schools earn base points for rounds won on stage, a +2 win bonus for winning their match, and a +5 margin bonus for winning by 10+ points. Your captain scores double."
        },
        {
            question: "Can I change my squad after drafting?",
            answer: "Yes! You can edit your lineup any time before the matchday's matches begin. Once results start coming in, your lineup is locked for that stage."
        },
        {
            question: "How do I claim my school badge?",
            answer: "Open the Chat tab and tap your school badge at the top. Search for your alma mater and select it; your badge shows up next to your name in chat and on the leaderboard."
        },
        {
            question: "Do I need to verify my phone number?",
            answer: "No OTP is needed at registration; your account is ready immediately. We only send SMS codes when you reset a forgotten password or change your phone number."
        }
    ]

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <main className="container max-w-4xl mx-auto px-4 pt-12">
                <div className="space-y-12">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
                            <HelpCircle className="h-12 w-12 text-primary" />
                        </div>
                        <h1 className="text-4xl font-black">Help Center</h1>
                        <p className="text-muted-foreground font-medium text-lg">Find answers to common questions</p>
                    </div>

                    {/* FAQs */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black mb-6">Frequently Asked Questions</h2>
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-3">
                                <h3 className="text-lg font-black text-foreground">{faq.question}</h3>
                                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                            </div>
                        ))}
                    </div>

                    {/* Contact Support */}
                    <div className="bg-gradient-to-br from-primary/10 to-indigo-600/10 border border-primary/20 rounded-3xl p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black">Still Need Help?</h2>
                            <p className="text-muted-foreground">Our support team is here to assist you</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <a
                                href="https://wa.me/233276019798"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-xl transition-standard group"
                            >
                                <MessageSquare className="h-6 w-6 text-emerald-400" />
                                <div>
                                    <p className="font-black text-foreground">WhatsApp Support</p>
                                    <p className="text-xs text-emerald-400">Chat with us now</p>
                                </div>
                            </a>

                            <a
                                href="tel:+233276019798"
                                className="flex items-center gap-4 p-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl transition-standard group"
                            >
                                <Phone className="h-6 w-6 text-blue-400" />
                                <div>
                                    <p className="font-black text-foreground">Call Us</p>
                                    <p className="text-xs text-blue-400">+233 27 601 9798</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Additional Resources */}
                    <div className="text-center space-y-4">
                        <p className="text-muted-foreground text-sm">Looking for more information?</p>
                        <Link
                            href="/how-to-play"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-standard"
                        >
                            Learn How to Play
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
