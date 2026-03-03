"use client"

import { useState, useEffect } from "react"
import { Plus, Key, Trash2, Power, Loader2, Settings2, ShieldAlert, Rocket, MessageSquare } from "lucide-react"
import { getApiKeys, addApiKey, toggleApiKey, deleteApiKey } from "@/lib/api-key-actions"
import { getSettings, updateSetting } from "@/lib/settings-actions"

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
    const [activeTab, setActiveTab] = useState<"general" | "api">("general")
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        key: "",
        provider: "github_models",
        label: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [platformSettings, setPlatformSettings] = useState<Record<string, any>>({
        maintenance_mode: false,
        min_bet: 1,
        max_bet: 1000,
        min_withdrawal: 10,
        betting_margin: 0.1,
    })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [keysData, settingsData] = await Promise.all([
            getApiKeys(),
            getSettings()
        ])
        setKeys(keysData as ApiKey[])
        if (Object.keys(settingsData).length > 0) {
            setPlatformSettings(prev => ({ ...prev, ...settingsData }))
        }
        setLoading(false)
    }

    const loadKeys = async () => {
        const data = await getApiKeys()
        setKeys(data as ApiKey[])
    }

    const handleUpdateSetting = async (key: string, value: any) => {
        setPlatformSettings(prev => ({ ...prev, [key]: value }))
        await updateSetting(key, value)
    }

    const handleSaveGeneral = async () => {
        setIsSaving(true)
        try {
            const promises = Object.entries(platformSettings).map(([k, v]) => updateSetting(k, v))
            await Promise.all(promises)
            alert("Settings saved successfully")
        } catch (error) {
            console.error(error)
            alert("Failed to save some settings")
        } finally {
            setIsSaving(false)
        }
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
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2 uppercase tracking-tighter">System Configuration</h1>
                        <p className="text-slate-400 text-sm">Manage platform rules, betting limits and AI infrastructure</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-2xl w-fit border border-white/5">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "general" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                            }`}
                    >
                        <Settings2 className="h-4 w-4" />
                        General Settings
                    </button>
                    <button
                        onClick={() => setActiveTab("api")}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "api" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                            }`}
                    >
                        <Key className="h-4 w-4" />
                        API Infrastructure
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                    </div>
                ) : activeTab === "general" ? (
                    <div className="space-y-6">
                        {/* Maintenance Mode Callout */}
                        <div className={`p-8 rounded-3xl border transition-all ${platformSettings.maintenance_mode ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900/40 border-white/5'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl ${platformSettings.maintenance_mode ? 'bg-red-500/20' : 'bg-slate-800'}`}>
                                        <ShieldAlert className={`h-8 w-8 ${platformSettings.maintenance_mode ? 'text-red-400' : 'text-slate-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Maintenance Mode</h3>
                                        <p className="text-slate-500 text-sm mt-1">Suspend all betting activities for system updates.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUpdateSetting("maintenance_mode", !platformSettings.maintenance_mode)}
                                    className={`relative w-16 h-8 rounded-full transition-colors ${platformSettings.maintenance_mode ? 'bg-red-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${platformSettings.maintenance_mode ? 'left-9 shadow-lg shadow-red-900' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Limits Card */}
                            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Rocket className="h-5 w-5 text-purple-400" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Wagering Limits</h3>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: "Minimum Bet", key: "min_bet", unit: "GHS" },
                                        { label: "Maximum Bet", key: "max_bet", unit: "GHS" },
                                        { label: "Minimum Withdrawal", key: "min_withdrawal", unit: "GHS" },
                                    ].map((field) => (
                                        <div key={field.key}>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{field.label}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={platformSettings[field.key]}
                                                    onChange={(e) => setPlatformSettings({ ...platformSettings, [field.key]: parseFloat(e.target.value) })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-purple-500 outline-none"
                                                />
                                                <span className="absolute right-4 top-3 text-[10px] font-bold text-slate-600 uppercase pt-0.5">{field.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Logic Card */}
                            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <MessageSquare className="h-5 w-5 text-emerald-400" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Business Logic</h3>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Platform Profit Margin</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={platformSettings.betting_margin}
                                            onChange={(e) => setPlatformSettings({ ...platformSettings, betting_margin: parseFloat(e.target.value) })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-purple-500 outline-none"
                                        />
                                        <div className="flex items-center px-4 bg-white/5 rounded-xl text-xs text-slate-400 font-bold italic">
                                            Currently {(platformSettings.betting_margin * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                    <p className="mt-4 text-[10px] text-slate-600 font-medium leading-relaxed italic border-l-2 border-emerald-500/20 pl-4">
                                        Note: Changing the margin affects all future AI market generation odds. Historical markets are preserved.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSaveGeneral}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-900/20 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Settings2 className="h-5 w-5" />}
                                {isSaving ? "Synchronizing..." : "Apply Global Changes"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-wide flex items-center gap-2 transition-all border border-white/10 text-xs"
                            >
                                <Plus className="h-4 w-4" />
                                Add New Infrastructure Key
                            </button>
                        </div>
                        {keys.length === 0 ? (
                            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-12 text-center">
                                <Key className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No API keys configured yet.</p>
                                <p className="text-slate-600 text-sm mt-2">Add your first key to enable AI features.</p>
                            </div>
                        ) : (
                            keys.map((key) => (
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
                            ))
                        )}
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
