"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { 
    getChannelMessages, 
    postMessage, 
    createChatRoom, 
    joinChatRoom, 
    getUserChatRooms, 
    getRoomMessages, 
    postRoomMessage, 
    getRoomLeaderboard 
} from "@/lib/chat-actions"
import { Send, Shield, Hash, MessageSquare, RefreshCw, Sparkles, Plus, Copy, Check, Users, Trophy, Award, Lock, Globe, X } from "lucide-react"

type ChatMessage = {
    id: string
    message: string
    createdAt: Date | string | null
    userId: string
    username: string | null
    almaMater: string | null
}

type CustomRoom = {
    id: string
    name: string
    creatorId: string
    isPublic: boolean
    inviteCode: string
    joinedAt: Date | string | null
}

type GroupMemberRank = {
    userId: string
    name: string
    almaMater: string | null
    weeklyPoints: number
    lifetimePoints: number
}

type ChatClientProps = {
    initialMessages: ChatMessage[]
    currentUser: {
        id: string
        name?: string | null
        almaMater?: string | null
        role?: string | null
    }
    activeGameWeek?: string
}

const GLOBAL_CHANNELS = [
    { id: "fantasy-tavern", name: "The Fantasy Tavern", desc: "General NSMQ chat, draft tips, and token talk" },
    { id: "kumasi-derby", name: "The Kumasi Derby", desc: "Ashanti region schools banter & matchups" },
    { id: "central-wave", name: "The Central Wave", desc: "Central region schools trash talk & standings" }
]

function getSchoolAcronym(name: string | null) {
    if (!name) return ""
    const clean = name.toLowerCase()
    if (clean.includes("presec")) return "PRESEC"
    if (clean.includes("mfantsipim")) return "MOBA"
    if (clean.includes("augustine")) return "APSU"
    if (clean.includes("adisadel")) return "SANTAC"
    if (clean.includes("prempeh")) return "Amanfoo"
    if (clean.includes("opoku ware")) return "Akatakyie"
    if (clean.includes("achimota")) return "Akora"
    if (clean.includes("wesley girls")) return "Gey Hey"
    if (clean.includes("accra academy")) return "Accra Aca"
    
    const parts = name.replace("Senior High", "").replace("School", "").replace("Technical", "").trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 5).toUpperCase()
    return parts.map(p => p[0]).join("").toUpperCase().substring(0, 6)
}

export function ChatClient({ initialMessages, currentUser, activeGameWeek }: ChatClientProps) {
    // Rooms and Channels Navigation state
    const [sidebarTab, setSidebarTab] = useState<"global" | "custom">("global")
    const [activeId, setActiveId] = useState<string>("fantasy-tavern") // can be channel id or custom room id
    const [customRooms, setCustomRooms] = useState<CustomRoom[]>([])
    
    // Messages and Input
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
    const [inputMessage, setInputMessage] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Create & Join custom rooms state
    const [newRoomName, setNewRoomName] = useState("")
    const [newRoomIsPublic, setNewRoomIsPublic] = useState(true)
    const [joinCodeInput, setJoinCodeInput] = useState("")
    const [isCreatingModal, setIsCreatingModal] = useState(false)
    const [isJoiningModal, setIsJoiningModal] = useState(false)
    
    // Group rankings panel state
    const [showRankings, setShowRankings] = useState(false)
    const [rankingsList, setRankingsList] = useState<GroupMemberRank[]>([])
    const [rankingsTab, setRankingsTab] = useState<"weekly" | "overall">("weekly")
    const [copied, setCopied] = useState(false)

    const isCustomRoomActive = customRooms.some(r => r.id === activeId)
    const activeRoomDetails = customRooms.find(r => r.id === activeId)

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Load custom rooms on mount
    useEffect(() => {
        getUserChatRooms().then(rooms => {
            setCustomRooms(rooms as CustomRoom[])
        })
    }, [])

    // Poll for new messages every 4 seconds
    useEffect(() => {
        const fetchMessages = async () => {
            if (isCustomRoomActive) {
                const fresh = await getRoomMessages(activeId)
                setMessages(fresh)
            } else {
                const fresh = await getChannelMessages(activeId)
                setMessages(fresh)
            }
        }

        // Fetch immediately
        fetchMessages()

        const interval = setInterval(fetchMessages, 4000)
        return () => clearInterval(interval)
    }, [activeId, isCustomRoomActive])

    // Load custom room rankings if panel is open
    useEffect(() => {
        if (showRankings && isCustomRoomActive) {
            getRoomLeaderboard(activeId, activeGameWeek || "National Finals").then(res => {
                if (res.success && res.data) {
                    setRankingsList(res.data as GroupMemberRank[])
                }
            })
        }
    }, [showRankings, activeId, isCustomRoomActive, activeGameWeek])

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        const text = inputMessage.trim()
        if (!text) return

        setError(null)
        setInputMessage("")

        startTransition(async () => {
            let result
            if (isCustomRoomActive) {
                result = await postRoomMessage(activeId, text)
            } else {
                result = await postMessage(activeId, text)
            }

            if (result.success && result.data) {
                setMessages(prev => [...prev, result.data as ChatMessage])
            } else {
                setError(result.error || "Failed to post message")
            }
        })
    }

    const handleCreateRoom = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!newRoomName.trim()) return

        startTransition(async () => {
            const res = await createChatRoom(newRoomName, newRoomIsPublic)
            if (res.success && res.roomId) {
                // Refresh rooms and set active
                const rooms = await getUserChatRooms()
                setCustomRooms(rooms as CustomRoom[])
                setActiveId(res.roomId)
                setSidebarTab("custom")
                setIsCreatingModal(false)
                setNewRoomName("")
            } else {
                setError(res.error || "Failed to create room")
            }
        })
    }

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!joinCodeInput.trim()) return

        startTransition(async () => {
            const res = await joinChatRoom(joinCodeInput)
            if (res.success && res.roomId) {
                const rooms = await getUserChatRooms()
                setCustomRooms(rooms as CustomRoom[])
                setActiveId(res.roomId)
                setSidebarTab("custom")
                setIsJoiningModal(false)
                setJoinCodeInput("")
            } else {
                setError(res.error || "Failed to join room")
            }
        })
    }

    const copyInviteCode = () => {
        if (!activeRoomDetails) return
        navigator.clipboard.writeText(activeRoomDetails.inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Sorted members for group ranking list
    const sortedRankings = [...rankingsList].sort((a, b) => {
        if (rankingsTab === "weekly") {
            return b.weeklyPoints - a.weeklyPoints
        }
        return b.lifetimePoints - a.lifetimePoints
    })

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 relative">
            
            {/* Sidebar Columns */}
            <div className="w-full md:w-80 flex flex-col gap-4 shrink-0 h-full">
                
                {/* Custom/Global Tabs Switcher */}
                <div className="flex bg-slate-900/50 p-1 border border-white/5 rounded-2xl">
                    <button
                        onClick={() => setSidebarTab("global")}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                            sidebarTab === "global" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Global Channels
                    </button>
                    <button
                        onClick={() => setSidebarTab("custom")}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                            sidebarTab === "custom" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        My Groups
                    </button>
                </div>

                {/* Rooms selection drawer */}
                <div className="flex-1 bg-slate-900 border border-white/5 p-4 rounded-3xl overflow-y-auto no-scrollbar flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                        {sidebarTab === "global" ? (
                            <div className="flex flex-col gap-2">
                                {GLOBAL_CHANNELS.map(ch => (
                                    <button
                                        key={ch.id}
                                        onClick={() => {
                                            setActiveId(ch.id)
                                            setShowRankings(false)
                                        }}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all ${
                                            activeId === ch.id
                                                ? "bg-purple-950/20 border-purple-500/30 text-white"
                                                : "bg-slate-950/50 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950"
                                        }`}
                                    >
                                        <div className="font-extrabold text-sm flex items-center gap-1.5">
                                            <Hash className="h-4 w-4 text-purple-400 shrink-0" />
                                            {ch.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1 font-semibold leading-normal">
                                            {ch.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {customRooms.length > 0 ? (
                                    customRooms.map(room => (
                                        <button
                                            key={room.id}
                                            onClick={() => {
                                                setActiveId(room.id)
                                                setShowRankings(false)
                                            }}
                                            className={`w-full text-left p-4 rounded-2xl border transition-all ${
                                                activeId === room.id
                                                    ? "bg-purple-950/20 border-purple-500/30 text-white"
                                                    : "bg-slate-950/50 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950"
                                            }`}
                                        >
                                            <div className="font-extrabold text-sm flex items-center justify-between gap-1.5">
                                                <span className="truncate flex items-center gap-1.5">
                                                    <Users className="h-4 w-4 text-purple-400 shrink-0" />
                                                    {room.name}
                                                </span>
                                                {room.isPublic ? (
                                                    <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
                                                ) : (
                                                    <Lock className="h-3 w-3 text-amber-500/80 shrink-0" />
                                                )}
                                            </div>
                                            <div className="text-[9px] text-slate-500 mt-1 font-black uppercase tracking-wider">
                                                Code: {room.inviteCode}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-600 text-xs font-semibold leading-relaxed">
                                        No custom groups joined yet. Create one or ask friends for an invite code!
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Room creation actions */}
                    {sidebarTab === "custom" && (
                        <div className="flex gap-2 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setIsJoiningModal(true)}
                                className="flex-1 py-3 border border-white/5 bg-slate-950/50 hover:bg-slate-950 hover:text-white transition-all text-xs font-bold text-slate-400 rounded-2xl cursor-pointer"
                            >
                                Join Group
                            </button>
                            <button
                                onClick={() => setIsCreatingModal(true)}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" /> Create
                            </button>
                        </div>
                    )}
                </div>

                {/* Users school badge display */}
                <div className="bg-slate-900 border border-white/5 p-4 rounded-3xl flex items-center justify-between shrink-0">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">School Badge</div>
                        <div className="text-sm font-black text-white mt-0.5">
                            {currentUser.almaMater ? currentUser.almaMater : "Coming soon"}
                        </div>
                    </div>
                    {currentUser.almaMater && (
                        <span className="text-[10px] font-black uppercase bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/20 shadow-sm">
                            {getSchoolAcronym(currentUser.almaMater)}
                        </span>
                    )}
                </div>

            </div>

            {/* Chat Board Area */}
            <div className="flex-1 flex flex-col bg-slate-900 border border-white/5 rounded-3xl overflow-hidden h-full">
                
                {/* Room/Channel Header */}
                <div className="bg-slate-950 border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="min-w-0 flex-1 pr-4">
                        <h3 className="font-extrabold text-md text-white flex items-center gap-1.5 truncate">
                            {isCustomRoomActive ? (
                                <>
                                    <Users className="h-5 w-5 text-purple-400 shrink-0" />
                                    {activeRoomDetails?.name}
                                </>
                            ) : (
                                <>
                                    <Hash className="h-5 w-5 text-purple-400 shrink-0" />
                                    {GLOBAL_CHANNELS.find(c => c.id === activeId)?.name}
                                </>
                            )}
                        </h3>
                        <p className="text-slate-500 text-[10px] font-semibold mt-0.5 truncate">
                            {isCustomRoomActive 
                                ? `Created Group • Share code: ${activeRoomDetails?.inviteCode}` 
                                : GLOBAL_CHANNELS.find(c => c.id === activeId)?.desc
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {isCustomRoomActive && (
                            <>
                                {/* Copy code button */}
                                <button
                                    onClick={copyInviteCode}
                                    className="p-2 border border-white/5 hover:border-white/10 hover:text-white rounded-xl text-slate-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                    <span className="hidden xs:inline">{activeRoomDetails?.inviteCode}</span>
                                </button>
                                
                                {/* Toggle rankings button */}
                                <button
                                    onClick={() => setShowRankings(!showRankings)}
                                    className={`p-2 border rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                        showRankings
                                            ? "bg-purple-600 border-purple-500 text-white shadow-md"
                                            : "border-white/5 hover:border-white/10 text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <Trophy className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Group Leaderboard</span>
                                </button>
                            </>
                        )}
                        <div className="hidden xs:flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-black shrink-0 pl-2">
                            <RefreshCw className="h-3 w-3 animate-spin text-purple-400" />
                            <span>Live</span>
                        </div>
                    </div>
                </div>

                {/* Messages Scroller */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                    {messages.length > 0 ? (
                        messages.map(msg => {
                            const isMe = msg.userId === currentUser.id
                            const acronym = getSchoolAcronym(msg.almaMater)

                            return (
                                <div 
                                    key={msg.id}
                                    className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                                >
                                    <div className="flex items-center gap-2 mb-1 text-[10px] font-bold text-slate-400">
                                        <span>{msg.username || "Anonymous"}</span>
                                        {acronym && (
                                            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide">
                                                {acronym}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`p-4 rounded-3xl text-sm leading-relaxed ${
                                        isMe 
                                            ? "bg-purple-600 text-white rounded-tr-none shadow-[0_4px_15px_rgba(168,85,247,0.15)]" 
                                            : "bg-slate-950 text-slate-200 rounded-tl-none border border-white/5"
                                    }`}>
                                        {msg.message}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="my-auto text-center py-8">
                            <Sparkles className="h-8 w-8 text-purple-500/30 mx-auto mb-2 animate-bounce" />
                            <p className="text-slate-500 text-xs font-semibold">Tavern is quiet... Drop a banter post first!</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat input box */}
                <div className="p-4 bg-slate-950 border-t border-white/5 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type a banter message..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            disabled={isPending}
                            className="flex-1 bg-slate-900 border border-white/5 px-4 py-3 rounded-2xl text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 text-white"
                        />
                        <button
                            type="submit"
                            disabled={isPending || !inputMessage.trim()}
                            className="bg-purple-600 text-white h-11 w-11 rounded-2xl flex items-center justify-center hover:bg-purple-500 active:scale-95 transition-all disabled:bg-slate-900 disabled:text-slate-700 disabled:border-white/5 border border-transparent shadow-[0_4px_15px_rgba(168,85,247,0.2)] shrink-0 cursor-pointer"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>

            </div>

            {/* Sliding Group Leaderboard Panel */}
            {showRankings && isCustomRoomActive && (
                <div className="absolute top-0 right-4 bottom-0 w-80 bg-slate-900 border-l border-white/5 rounded-r-3xl z-40 p-5 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h4 className="font-extrabold text-md text-white flex items-center gap-2">
                            <Trophy className="h-4.5 w-4.5 text-yellow-400" /> Member Rankings
                        </h4>
                        <button 
                            onClick={() => setShowRankings(false)} 
                            className="text-slate-500 hover:text-white p-1 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                        >
                            <X className="h-4.5 w-4.5" />
                        </button>
                    </div>

                    {/* Weekly vs Overall Tab switch */}
                    <div className="flex bg-slate-950 p-1 border border-white/5 rounded-xl shrink-0">
                        <button
                            onClick={() => setRankingsTab("weekly")}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                rankingsTab === "weekly" ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            GW Points
                        </button>
                        <button
                            onClick={() => setRankingsTab("overall")}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                rankingsTab === "overall" ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            Overall
                        </button>
                    </div>

                    {/* Ranked List scroll container */}
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                        {sortedRankings.length > 0 ? (
                            sortedRankings.map((rank, idx) => {
                                const acronym = getSchoolAcronym(rank.almaMater)
                                const isFirst = idx === 0
                                const isSecond = idx === 1
                                const isThird = idx === 2
                                const points = rankingsTab === "weekly" ? rank.weeklyPoints : rank.lifetimePoints

                                return (
                                    <div 
                                        key={rank.userId}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            isFirst 
                                                ? "bg-yellow-500/5 border-yellow-500/20" 
                                                : isSecond 
                                                ? "bg-slate-400/5 border-slate-400/20" 
                                                : isThird 
                                                ? "bg-amber-700/5 border-amber-700/20" 
                                                : "bg-slate-950/40 border-transparent"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Rank Icon or number */}
                                            <div className="w-6 h-6 flex items-center justify-center font-bold text-xs shrink-0">
                                                {isFirst ? (
                                                    <Award className="h-5 w-5 text-yellow-400" />
                                                ) : isSecond ? (
                                                    <Award className="h-5 w-5 text-slate-300" />
                                                ) : isThird ? (
                                                    <Award className="h-5 w-5 text-amber-600" />
                                                ) : (
                                                    <span className="text-slate-500">{idx + 1}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-extrabold text-xs text-white truncate">{rank.name}</div>
                                                {acronym && (
                                                    <div className="text-[9px] font-black uppercase text-purple-400 tracking-wider mt-0.5">
                                                        {acronym}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="font-mono font-black text-xs text-white">
                                            {points} pts
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-10 text-xs text-slate-600 font-semibold">
                                Loading group members list...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Room Modal */}
            {isCreatingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreatingModal(false)} />
                    <div className="relative bg-slate-900 border border-white/10 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col gap-5">
                            <div>
                                <h3 className="font-russo uppercase tracking-wider text-white text-md">Create Group</h3>
                                <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-normal">Build your private fantasy room and invite friends to compete.</p>
                            </div>
                            <form onSubmit={handleCreateRoom} className="space-y-4">
                                <div>
                                    <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Group Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newRoomName}
                                        onChange={(e) => setNewRoomName(e.target.value)}
                                        placeholder="e.g. Accra Aca Boys"
                                        className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-white/5">
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-slate-300">Public Access</div>
                                        <div className="text-[8px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">Let anyone join this group</div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={newRoomIsPublic}
                                        onChange={(e) => setNewRoomIsPublic(e.target.checked)}
                                        className="h-4 w-4 accent-purple-600 rounded cursor-pointer"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCreatingModal(false)} 
                                        className="flex-1 py-3 border border-white/5 hover:bg-white/5 hover:text-white transition-all text-xs font-bold text-slate-500 rounded-xl cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isPending}
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                    >
                                        {isPending ? "Creating..." : "Create Room"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Room Modal */}
            {isJoiningModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsJoiningModal(false)} />
                    <div className="relative bg-slate-900 border border-white/10 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col gap-5">
                            <div>
                                <h3 className="font-russo uppercase tracking-wider text-white text-md">Join Group</h3>
                                <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-normal">Enter the 6-character alphanumeric invite code to join a custom room.</p>
                            </div>
                            <form onSubmit={handleJoinRoom} className="space-y-4">
                                <div>
                                    <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Invite Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={joinCodeInput}
                                        onChange={(e) => setJoinCodeInput(e.target.value)}
                                        placeholder="e.g. A3B8C9"
                                        maxLength={6}
                                        className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-sm text-center font-mono font-black uppercase text-purple-400 placeholder-slate-700 tracking-widest focus:outline-none focus:border-purple-500/50 text-white"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsJoiningModal(false)} 
                                        className="flex-1 py-3 border border-white/5 hover:bg-white/5 hover:text-white transition-all text-xs font-bold text-slate-500 rounded-xl cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isPending}
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                    >
                                        {isPending ? "Joining..." : "Join"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
