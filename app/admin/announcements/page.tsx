"use client"

import React, { useState, useEffect } from "react"
import { Plus, Trash2, Megaphone, Image as ImageIcon, Link as LinkIcon, Save, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, uploadAdvertImage } from "@/lib/announcement-actions"
import { Announcement } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function AdminAnnouncementsPage() {
    const [ads, setAds] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [formData, setFormData] = useState<Partial<Announcement>>({
        type: "text",
        content: "",
        imageUrl: "",
        link: "",
        priority: 0,
        style: "default"
    })

    async function loadAds() {
        // Only set loading if not already true
        const data = await getAllAnnouncements()
        return data as Announcement[]
    }

    useEffect(() => {
        let isMounted = true
        loadAds().then(data => {
            if (isMounted) {
                setAds(data)
                setLoading(false)
            }
        })
        return () => { isMounted = false }
    }, [])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        let finalImageUrl = formData.imageUrl

        // Handle File Upload if an image was selected locally
        if (formData.type === "image" && selectedFile) {
            try {
                // Read file as base64
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                })
                reader.readAsDataURL(selectedFile)
                const base64Data = await base64Promise

                // Upload to server
                const uploadResult = await uploadAdvertImage(base64Data, selectedFile.name)

                if (uploadResult.success && uploadResult.url) {
                    finalImageUrl = uploadResult.url
                } else {
                    alert("Image upload failed.")
                    setLoading(false)
                    return
                }
            } catch (error) {
                console.error("Upload error:", error)
                alert("Failed to process local image.")
                setLoading(false)
                return
            }
        }

        const result = await createAnnouncement({
            type: formData.type as "text" | "image",
            content: formData.content || undefined,
            imageUrl: finalImageUrl || undefined,
            link: formData.link || undefined,
            priority: formData.priority || 0,
            style: formData.style || "default"
        })

        if (result.success) {
            setIsAdding(false)
            setFormData({ type: "text", content: "", imageUrl: "", link: "", priority: 0, style: "default" })
            setSelectedFile(null)
            setPreviewUrl(null)
            const data = await loadAds()
            setAds(data)
        }
        setLoading(false)
    }

    async function toggleStatus(id: string, current: boolean) {
        setLoading(true)
        const result = await updateAnnouncement(id, { isActive: !current })
        if (result.success) {
            const data = await loadAds()
            setAds(data)
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (window.confirm("Delete this advert?")) {
            setLoading(true)
            const result = await deleteAnnouncement(id)
            if (result.success) {
                const data = await loadAds()
                setAds(data)
            }
            setLoading(false)
        }
    }

    const THEMES = [
        { id: "default", name: "Classic", color: "bg-purple-600" },
        { id: "neon", name: "Neon Vibes", color: "bg-purple-400" },
        { id: "gold", name: "Gold Edition", color: "bg-yellow-500" },
        { id: "cyber", name: "Cyberpunk", color: "bg-cyan-400" },
        { id: "minimal", name: "Minimal", color: "bg-slate-400" },
        { id: "fire", name: "Pulse Fire", color: "bg-orange-500" },
    ]

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Advert Management</h1>
                    <p className="text-slate-400">Create displays for new games, referrals, and promos</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest px-6"
                >
                    {isAdding ? "Cancel" : <><Plus className="h-5 w-5 mr-2" /> New Advert</>}
                </Button>
            </div>

            {/* Create Form */}
            {isAdding && (
                <div className="bg-[#0f1115] border border-white/10 rounded-[2.5rem] p-8 mb-8 animate-in slide-in-from-top-4 duration-300 shadow-2xl">
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Advert Type</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "text" })}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all",
                                            formData.type === "text" ? "bg-primary border-primary text-black" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        )}
                                    >
                                        <Megaphone className="h-4 w-4" /> Text Message
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "image" })}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all",
                                            formData.type === "image" ? "bg-primary border-primary text-black" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        )}
                                    >
                                        <ImageIcon className="h-4 w-4" /> Image Banner
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority (Higher shows first)</label>
                                <input
                                    type="number"
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                                    placeholder="0"
                                />
                            </div>

                            {formData.type === "text" ? (
                                <>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message Content</label>
                                        <input
                                            type="text"
                                            value={formData.content || ""}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all text-xl font-bold"
                                            placeholder="e.g. New Virtual Games Added! Play Now."
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Theme</label>
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                            {THEMES.map(theme => (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, style: theme.id })}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                                                        formData.style === theme.id ? "bg-white/10 border-primary" : "bg-white/5 border-white/5 hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className={cn("h-4 w-4 rounded-full", theme.color)} />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{theme.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Banner Image</label>

                                    {!previewUrl && !formData.imageUrl ? (
                                        <div
                                            className="relative w-full h-32 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group overflow-hidden"
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        setSelectedFile(file)
                                                        setPreviewUrl(URL.createObjectURL(file))
                                                        setFormData({ ...formData, imageUrl: "" }) // Clear manual URL if using file
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                required={!formData.imageUrl}
                                            />
                                            <ImageIcon className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                                            <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                                                Click or drag image here
                                            </span>
                                            <span className="text-[10px] text-slate-600">Max size: 5MB</span>
                                        </div>
                                    ) : (
                                        <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/50 aspect-[5/1] w-full flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={previewUrl || formData.imageUrl || ""}
                                                alt="Banner preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedFile(null)
                                                        setPreviewUrl(null)
                                                        setFormData(prev => ({ ...prev, imageUrl: "" }))
                                                    }}
                                                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white font-bold text-xs uppercase transition-colors"
                                                >
                                                    Remove Image
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="h-[1px] flex-1 bg-white/5" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase">OR PASTE URL</span>
                                        <div className="h-[1px] flex-1 bg-white/5" />
                                    </div>

                                    <div className="relative mt-2">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <input
                                            type="url"
                                            value={formData.imageUrl || ""}
                                            onChange={e => {
                                                setFormData({ ...formData, imageUrl: e.target.value })
                                                if (e.target.value) {
                                                    setSelectedFile(null)
                                                    setPreviewUrl(null)
                                                }
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-all text-sm"
                                            placeholder="https://example.com/banner.jpg"
                                            required={!selectedFile}
                                        />
                                    </div>

                                    <p className="text-[10px] text-slate-500 mt-2 px-1">Note: Recommended size 1200x220px for best results.</p>
                                </div>
                            )}

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Click Link (Optional)</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={formData.link || ""}
                                        onChange={e => setFormData({ ...formData, link: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                                        placeholder="/virtuals or https://google.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest px-8 py-6 rounded-2xl shadow-lg shadow-primary/20"
                            >
                                <Save className="h-5 w-5 mr-2" /> Save Advert
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Ads List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="py-20 text-center animate-pulse">
                        <Megaphone className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest">Loading adverts...</p>
                    </div>
                ) : ads.length === 0 ? (
                    <div className="py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <Megaphone className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest">No adverts found</p>
                    </div>
                ) : (
                    ads.map((ad) => (
                        <div
                            key={ad.id}
                            className={cn(
                                "group bg-[#0f1115] border rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 transition-all hover:bg-white/[0.02]",
                                ad.isActive ? "border-white/10" : "border-white/5 grayscale opacity-60"
                            )}
                        >
                            <div className="p-4 bg-white/5 rounded-2xl">
                                {ad.type === "text" ? <Megaphone className="h-8 w-8 text-primary" /> : <ImageIcon className="h-8 w-8 text-blue-400" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                        ad.type === "text" ? "bg-primary/10 text-primary border border-primary/20" : "bg-blue-400/10 text-blue-400 border border-blue-400/20"
                                    )}>
                                        {ad.type === "text" ? "Text Message" : "Image Banner"}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        Priority: {ad.priority}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white truncate max-w-lg">
                                    {ad.type === "text" ? ad.content : ad.imageUrl}
                                </h3>
                                {ad.link && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                        <LinkIcon className="h-3 w-3" />
                                        <span className="truncate">{ad.link}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleStatus(ad.id, ad.isActive)}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all",
                                        ad.isActive
                                            ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                                            : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                                    )}
                                    title={ad.isActive ? "Deactivate" : "Activate"}
                                >
                                    {ad.isActive ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                </button>
                                <button
                                    onClick={() => handleDelete(ad.id)}
                                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
