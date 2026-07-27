import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getChannelMessages } from "@/lib/chat-actions"
import { ChatClient } from "./ChatClient"

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/auth/login?callbackUrl=/chat")
    }

    // Fetch initial messages for default channel
    const initialMessages = await getChannelMessages("fantasy-tavern")

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <ChatClient
                initialMessages={initialMessages}
                currentUser={session.user}
            />
        </div>
    )
}
