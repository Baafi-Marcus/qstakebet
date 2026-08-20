const fs = require('fs');

const path = 'app/admin/verify-results/VerifyResultsClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
    'import { ShieldExclamationIcon as ShieldAlert, CheckCircleIcon as CheckCircle, InformationCircleIcon as Info, CalendarIcon as Calendar, TrophyIcon as Trophy, ChevronRightIcon as ChevronRight } from "@heroicons/react/24/solid";',
    'import { ShieldExclamationIcon as ShieldAlert, CheckCircleIcon as CheckCircle, InformationCircleIcon as Info, CalendarIcon as Calendar, TrophyIcon as Trophy, ChevronRightIcon as ChevronRight, SparklesIcon as Sparkles } from "@heroicons/react/24/solid";\nimport { extractMatchResultFromText } from "@/lib/admin-actions";'
);

// 2. Add state
content = content.replace(
    'const [isPending, startTransition] = useTransition()',
    'const [isPending, startTransition] = useTransition()\n    const [isExtracting, startExtractTransition] = useTransition()\n    const [aiText, setAiText] = useState("")'
);

// 3. Add to handleSelectMatch
content = content.replace(
    'setDailyHigh([])\n    }',
    'setDailyHigh([])\n        setAiText("")\n    }'
);

// 4. Add handleExtractScores
const extractFunc = `
    const handleExtractScores = () => {
        if (!selectedMatch || !aiText.trim()) return

        startExtractTransition(async () => {
            const res = await extractMatchResultFromText(aiText, selectedMatch.id)
            if (res.success && res.customScores) {
                // Merge extracted scores with existing
                setScores(prev => ({ ...prev, ...res.customScores }))
                setMessage({ type: "success", text: "AI successfully extracted and mapped the scores!" })
                setAiText("") // clear text area
            } else {
                setMessage({ type: "error", text: res.error || "Failed to extract scores from text" })
            }
        })
    }

    const handleSettle = () => {`;

content = content.replace('const handleSettle = () => {', extractFunc);

// 5. Add JSX
const jsx = `                            <h3 className="text-2xl font-black text-white mt-1">Settle Stage Scores & Modifiers</h3>
                        </div>

                        {/* AI Text Paste Section */}
                        <div className="bg-purple-950/20 border border-purple-500/20 p-5 rounded-2xl flex flex-col gap-3">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5" /> AI Score Extractor
                            </label>
                            <textarea
                                value={aiText}
                                onChange={(e) => setAiText(e.target.value)}
                                placeholder="Paste official result tweet or text here..."
                                className="w-full h-24 bg-slate-950 border border-white/5 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 resize-none"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleExtractScores}
                                    disabled={isExtracting || !aiText.trim()}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                                >
                                    {isExtracting ? "Extracting..." : "Extract Scores via AI"}
                                </button>
                            </div>
                        </div>

                        {/* Schools Input List */}`;

content = content.replace(
    '<h3 className="text-2xl font-black text-white mt-1">Settle Stage Scores & Modifiers</h3>\n                        </div>\n\n                        {/* Schools Input List */}',
    jsx
);

fs.writeFileSync(path, content, 'utf8');
console.log("File updated successfully");
