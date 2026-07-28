"use client"

import { useState } from "react"
import { parseFixturesWithAI, saveImportedMatches } from "./import-actions"
import { X, Upload, FileText, ImageIcon, Loader2, Save, Trash2, CheckCircle2 } from "lucide-react"

type ImportFixturesModalProps = {
    isOpen: boolean
    onClose: () => void
}

export function ImportFixturesModal({ isOpen, onClose }: ImportFixturesModalProps) {
    const [mode, setMode] = useState<"text" | "image">("text")
    const [textInput, setTextInput] = useState("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    
    const [isParsing, setIsParsing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    
    const [parsedMatches, setParsedMatches] = useState<any[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    if (!isOpen) return null

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleParse = async () => {
        if (mode === "text" && !textInput.trim()) {
            setError("Please enter some text.")
            return
        }
        if (mode === "image" && !imageFile) {
            setError("Please select an image.")
            return
        }

        setIsParsing(true)
        setError(null)
        setSuccess(false)
        setParsedMatches(null)

        const formData = new FormData()
        if (mode === "text") formData.append("text", textInput)
        if (mode === "image" && imageFile) formData.append("image", imageFile)

        const result = await parseFixturesWithAI(formData)
        setIsParsing(false)

        if (result.success && result.data) {
            setParsedMatches(result.data)
        } else {
            setError(result.error || "Failed to parse fixtures.")
        }
    }

    const handleSave = async () => {
        if (!parsedMatches || parsedMatches.length === 0) return
        
        setIsSaving(true)
        setError(null)
        
        const result = await saveImportedMatches(parsedMatches)
        setIsSaving(false)

        if (result.success) {
            setSuccess(true)
            setTimeout(() => {
                resetAndClose()
            }, 2000)
        } else {
            setError(result.error || "Failed to save matches.")
        }
    }

    const resetAndClose = () => {
        setTextInput("")
        setImageFile(null)
        setImagePreview(null)
        setParsedMatches(null)
        setError(null)
        setSuccess(false)
        setMode("text")
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Import Fixtures via AI</h2>
                        <p className="text-slate-400 text-sm">Upload an image or paste text to automatically extract matches using Gemini.</p>
                    </div>
                    <button onClick={resetAndClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {error && (
                        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-bold">Matches saved successfully!</span>
                        </div>
                    )}

                    {!parsedMatches ? (
                        <>
                            <div className="flex gap-2 mb-6 p-1 bg-black/40 rounded-xl w-fit">
                                <button
                                    onClick={() => setMode("text")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === "text" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                                >
                                    <FileText className="h-4 w-4" /> Raw Text
                                </button>
                                <button
                                    onClick={() => setMode("image")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === "image" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                                >
                                    <ImageIcon className="h-4 w-4" /> Image Upload
                                </button>
                            </div>

                            {mode === "text" ? (
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Paste the fixtures text here... e.g. Prempeh vs Presec on Oct 14 at 10:00 AM"
                                    className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-purple-500 focus:outline-none resize-none"
                                />
                            ) : (
                                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                                    {imagePreview ? (
                                        <div className="relative group">
                                            <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="bg-rose-500 text-white p-2 rounded-full">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-10 w-10 text-slate-500 mb-4" />
                                            <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                                            <p className="text-slate-500 text-sm mb-4">PNG, JPG or JPEG (Max 5MB)</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20 cursor-pointer"
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleParse}
                                    disabled={isParsing || (mode === "text" ? !textInput : !imageFile)}
                                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2"
                                >
                                    {isParsing ? <><Loader2 className="h-4 w-4 animate-spin" /> Parsing...</> : "Parse with AI"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    Extracted Matches ({parsedMatches.length})
                                </h3>
                                <button onClick={() => setParsedMatches(null)} className="text-slate-400 hover:text-white text-sm underline">
                                    Start Over
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {parsedMatches.map((match, i) => (
                                    <div key={i} className="bg-black/40 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{match.stage}</span>
                                            <span className="text-xs text-slate-400">{new Date(match.scheduledAt).toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {match.participants?.map((p: any, j: number) => (
                                                <div key={j} className="flex items-center justify-between">
                                                    <span className="text-white font-medium">{p.name}</span>
                                                    <span className="text-xs text-slate-500 font-mono">{p.schoolId || "UNKNOWN ID"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    onClick={resetAndClose}
                                    className="px-6 py-2.5 text-slate-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2"
                                >
                                    {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Confirm & Save</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
