"use client"

import { useState, useEffect } from "react"
import { Plus, Key, Trash2, Power, Loader2 } from "lucide-react"
import { getApiKeys, addApiKey, toggleApiKey, deleteApiKey } from "@/lib/api-key-actions"

type ApiKey = {
    id: string
    key: string
    provider: string
    label: string | null
    isActive: boolean
    usageCount: number
    errorCount: number
    lastUsedAt: Date | null
    createdAt: Date | null
}

export default function SettingsPage() {
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        key: "",
        provider: "github_models",
        label: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadKeys()
    }, [])

    const loadKeys = async () => {
        setLoading(true)
        const data = await getApiKeys()
        setKeys(data as ApiKey[])
        setLoading(false)
    }

    const handleAdd = async () => {
        if (!formData.key.trim()) {
            alert("Please enter an API key")
            return
        }

        setIsSubmitting(true)
        try {
            await addApiKey(formData)
            setIsAddModalOpen(false)
            setFormData({ key: "", provider: "github_models", label: "" })
            await loadKeys()
        } catch (error) {
            console.error(error)
            alert("Failed to add key")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggle = async (keyId: string, currentStatus: boolean) => {
        await toggleApiKey(keyId, !currentStatus)
        await loadKeys()
    }

    const handleDelete = async (keyId: string) => {
        if (!confirm("Are you sure you want to delete this API key?")) return
        await deleteApiKey(keyId)
        await loadKeys()
    }

    const maskKey = (key: string) => {
        if (key.length <= 8) return "***"
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">API Key Manager</h1>
                        <p className="text-slate-400 text-sm">Manage your AI API keys for automatic rotation</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide flex items-center gap-2 transition-all"
                    >
                        <Plus className="h-5 w-5" />
                        Add Key
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                    </div>
                ) : keys.length === 0 ? (
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-12 text-center">
                        <Key className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No API keys configured yet.</p>
                        <p className="text-slate-600 text-sm mt-2">Add your first key to enable AI features.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {keys.map((key) => (
                            <div
                                key={key.id}
                                className={`bg-slate-900/40 border p-6 rounded-2xl transition-all ${key.isActive ? "border-purple-500/30" : "border-white/5 opacity-60"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${key.isActive ? "bg-purple-500/10" : "bg-slate-800"}`}>
                                            <Key className={`h-5 w-5 ${key.isActive ? "text-purple-400" : "text-slate-600"}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-white font-bold">
                                                    {key.label || "Unnamed Key"}
                                                </h3>
                                                <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-slate-400 uppercase tracking-wider">
                                                    {key.provider}
                                                </span>
                                                {key.isActive && (
                                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-500/30">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-slate-500 text-sm font-mono">{maskKey(key.key)}</div>
                                            <div className="flex gap-4 mt-2 text-xs text-slate-600">
                                                <span>Uses: {key.usageCount}</span>
                                                <span>Errors: {key.errorCount}</span>
                                                {key.lastUsedAt && (
                                                    <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggle(key.id, key.isActive)}
                                            className={`p-2 rounded-lg transition-all ${key.isActive
                                                    ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                                    : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                                                }`}
                                            title={key.isActive ? "Deactivate" : "Activate"}
                                        >
                                            <Power className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(key.id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Add API Key</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none font-mono"
                                    placeholder="ghp_xxxxxxxxxxxxx"
                                    value={formData.key}
                                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    Provider
                                </label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                    value={formData.provider}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                >
                                    <option value="github_models">GitHub Models</option>
                                    <option value="openai">OpenAI</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    Label (Optional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none"
                                    placeholder="e.g. Primary Key"
                                    value={formData.label}
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 flex gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wide py-3 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={isSubmitting}
                                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wide py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isSubmitting ? "Adding..." : "Add Key"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
