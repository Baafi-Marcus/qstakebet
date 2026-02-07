import { Cookie, Settings, ShieldCheck } from "lucide-react"

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 mb-4">
                        <Cookie className="h-8 w-8 text-orange-500" />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-3">Cookie Policy</h1>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Ensuring a better experience</p>
                </div>

                {/* Content */}
                <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 md:p-12 space-y-8">

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Cookie className="h-5 w-5 text-orange-500" />
                            1. What Are Cookies?
                        </h2>
                        <div className="text-slate-400 leading-relaxed">
                            <p>Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-orange-500" />
                            2. How We Use Cookies
                        </h2>
                        <div className="text-slate-400 leading-relaxed space-y-4">
                            <p>We use cookies for several purposes:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong className="text-white">Essential Cookies:</strong> Necessary for the website to function correctly (e.g., keeping you logged in).</li>
                                <li><strong className="text-white">Performance Cookies:</strong> Help us understand how visitors interact with the website.</li>
                                <li><strong className="text-white">Functionality Cookies:</strong> Allow the website to remember choices you make (such as your preferred region).</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-orange-500" />
                            3. Managing Cookies
                        </h2>
                        <div className="text-slate-400 leading-relaxed">
                            <p>Most web browsers allow you to control cookies through their settings preferences. However, limiting cookies may affect the functionality of QSTAKEbet.</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    )
}
