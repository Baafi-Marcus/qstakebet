import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getChannelMessages } from "@/lib/chat-actions"
import { ChatClient } from "./ChatClient"
import { getActiveFantasyStage } from "@/lib/fantasy-actions"

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/auth/login?callbackUrl=/chat")
    }

    // Fetch initial messages for default channel
    const initialMessages = await getChannelMessages("fantasy-tavern")
    const activeStage = await getActiveFantasyStage()

    return (
        <div className="min-h-screen bg-background text-foreground">
            <ChatClient
                initialMessages={initialMessages}
                currentUser={session.user}
                activeGameWeek={activeStage.gameWeek}
            />
        </div>
    )
}
