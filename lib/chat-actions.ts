"use server"

import { db } from "@/lib/db"
import { chatMessages, users, chatRooms, chatRoomMembers, fantasyLineups } from "@/lib/db/schema"
import { eq, desc, and, inArray, sql, gt, lt, isNull, ne } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"

const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;
const GLOBAL_CHANNEL_IDS = ["fantasy-tavern", "kumasi-derby", "central-wave"];

function ttlCutoff() {
    return new Date(Date.now() - MESSAGE_TTL_MS);
}

// 1. Fetch messages in a channel (global)
export async function getChannelMessages(channel: string, limit: number = 50) {
    try {
        const results = await db.select({
            id: chatMessages.id,
            message: chatMessages.content,
            createdAt: chatMessages.createdAt,
            userId: chatMessages.userId,
            username: sql<string>`COALESCE(${users.username}, ${users.name})`,
            almaMater: users.almaMater,
        })
            .from(chatMessages)
            .innerJoin(users, eq(chatMessages.userId, users.id))
            .where(
                and(
                    eq(chatMessages.channel, channel),
                    gt(chatMessages.createdAt, ttlCutoff())
                )
            )
            .orderBy(desc(chatMessages.createdAt))
            .limit(limit)

        return results.reverse()
    } catch (error) {
        console.error(`Error in getChannelMessages for ${channel}:`, error)
        return []
    }
}

// 2. Post message to a global channel
export async function postMessage(channel: string, message: string) {
    try {
        const limiter = await rateLimit("post-message", 10, 60000)
        if (!limiter.success) {
            return { success: false, error: "Too many messages. Please wait a moment." }
        }

        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "Please log in to post messages" }
        }

        const trimmed = message.trim()
        if (!trimmed) {
            return { success: false, error: "Message cannot be empty" }
        }

        if (trimmed.length > 300) {
            return { success: false, error: "Message must be under 300 characters" }
        }

        const userId = session.user.id
        const messageId = `msg-${Math.random().toString(36).substr(2, 9)}`

        const userRec = await db.select({
            almaMater: users.almaMater,
            displayName: sql<string>`COALESCE(${users.username}, ${users.name})`,
        })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
        const almaMaterVal = userRec[0]?.almaMater || null

        await db.insert(chatMessages).values({
            id: messageId,
            userId,
            channel,
            content: trimmed,
        })

        try {
            await db.delete(chatMessages).where(lt(chatMessages.createdAt, ttlCutoff()))
        } catch (e) {
            console.error("Error pruning expired chat messages:", e)
        }

        const fullMessage = {
            id: messageId,
            message: trimmed,
            createdAt: new Date(),
            userId,
            username: userRec[0]?.displayName || "Anonymous",
            almaMater: almaMaterVal
        }

        return { success: true, data: fullMessage }
    } catch (error: any) {
        console.error("Error in postMessage:", error)
        return { success: false, error: error.message || "Failed to send message" }
    }
}

// 3. Create a custom chat room
export async function createChatRoom(name: string, isPublic: boolean) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "Not logged in" }

        const roomName = name.trim()
        if (!roomName || roomName.length > 50) {
            return { success: false, error: "Group name must be between 1 and 50 characters" }
        }

        const roomId = `crm-${Math.random().toString(36).substr(2, 9)}`
        
        // Generate unique 6-character alphanumeric invite code
        let inviteCode = ""
        let isUnique = false
        while (!isUnique) {
            inviteCode = Math.random().toString(36).substr(2, 6).toUpperCase()
            const existing = await db.select({ id: chatRooms.id })
                .from(chatRooms)
                .where(eq(chatRooms.inviteCode, inviteCode))
                .limit(1)
            if (existing.length === 0) isUnique = true
        }

        await db.insert(chatRooms).values({
            id: roomId,
            name: roomName,
            creatorId: session.user.id,
            isPublic,
            inviteCode
        })

        // Auto-join the creator to the group
        await db.insert(chatRoomMembers).values({
            id: `crmb-${Math.random().toString(36).substr(2, 9)}`,
            roomId,
            userId: session.user.id
        })

        return { success: true, roomId, inviteCode }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// 4. Join a custom chat room via Invite Code
export async function joinChatRoom(inviteCode: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "Not logged in" }

        const code = inviteCode.trim().toUpperCase()
        if (!code) return { success: false, error: "Please enter an invite code" }

        // Find room by invite code
        const room = await db.select().from(chatRooms).where(eq(chatRooms.inviteCode, code)).limit(1)
        if (room.length === 0) return { success: false, error: "Room not found. Check the code." }

        const roomId = room[0].id

        // Check if already a member
        const existing = await db.select()
            .from(chatRoomMembers)
            .where(
                and(
                    eq(chatRoomMembers.roomId, roomId),
                    eq(chatRoomMembers.userId, session.user.id)
                )
            )
            .limit(1)

        if (existing.length > 0) {
            return { success: true, roomId, message: "Already joined" }
        }

        // Join room
        await db.insert(chatRoomMembers).values({
            id: `crmb-${Math.random().toString(36).substr(2, 9)}`,
            roomId,
            userId: session.user.id
        })

        return { success: true, roomId }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// 5. Get custom rooms user has created or joined
export async function getUserChatRooms() {
    try {
        const session = await auth()
        if (!session?.user?.id) return []

        // Find rooms where user is a member
        const results = await db.select({
            id: chatRooms.id,
            name: chatRooms.name,
            creatorId: chatRooms.creatorId,
            isPublic: chatRooms.isPublic,
            inviteCode: chatRooms.inviteCode,
            joinedAt: chatRoomMembers.joinedAt
        })
            .from(chatRoomMembers)
            .innerJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id))
            .where(eq(chatRoomMembers.userId, session.user.id))

        return results
    } catch (error) {
        console.error("Error in getUserChatRooms:", error)
        return []
    }
}

// 6. Get messages for a custom chat room
export async function getRoomMessages(roomId: string, limit: number = 50) {
    try {
        const session = await auth()
        if (!session?.user?.id) return []

        // Verify membership
        const member = await db.select()
            .from(chatRoomMembers)
            .where(
                and(
                    eq(chatRoomMembers.roomId, roomId),
                    eq(chatRoomMembers.userId, session.user.id)
                )
            )
            .limit(1)

        if (member.length === 0) return []

        const results = await db.select({
            id: chatMessages.id,
            message: chatMessages.content,
            createdAt: chatMessages.createdAt,
            userId: chatMessages.userId,
            username: sql<string>`COALESCE(${users.username}, ${users.name})`,
            almaMater: users.almaMater
        })
            .from(chatMessages)
            .innerJoin(users, eq(chatMessages.userId, users.id))
            .where(
                and(
                    eq(chatMessages.roomId, roomId),
                    gt(chatMessages.createdAt, ttlCutoff())
                )
            )
            .orderBy(desc(chatMessages.createdAt))
            .limit(limit)

        return results.reverse()
    } catch (error) {
        console.error(`Error in getRoomMessages for ${roomId}:`, error)
        return []
    }
}

// 7. Post a message to a custom chat room
export async function postRoomMessage(roomId: string, message: string) {
    try {
        const limiter = await rateLimit("post-message", 10, 60000)
        if (!limiter.success) {
            return { success: false, error: "Too many messages. Please wait a moment." }
        }

        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "Please log in to post messages" }
        }

        // Verify membership
        const member = await db.select()
            .from(chatRoomMembers)
            .where(
                and(
                    eq(chatRoomMembers.roomId, roomId),
                    eq(chatRoomMembers.userId, session.user.id)
                )
            )
            .limit(1)

        if (member.length === 0) {
            return { success: false, error: "You are not a member of this room" }
        }

        const trimmed = message.trim()
        if (!trimmed) {
            return { success: false, error: "Message cannot be empty" }
        }

        if (trimmed.length > 300) {
            return { success: false, error: "Message must be under 300 characters" }
        }

        const userId = session.user.id
        const messageId = `msg-${Math.random().toString(36).substr(2, 9)}`

        const userRec = await db.select({
            almaMater: users.almaMater,
            displayName: sql<string>`COALESCE(${users.username}, ${users.name})`,
        })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
        const almaMaterVal = userRec[0]?.almaMater || null

        await db.insert(chatMessages).values({
            id: messageId,
            userId,
            channel: "custom",
            roomId,
            content: trimmed,
        })

        try {
            await db.delete(chatMessages).where(lt(chatMessages.createdAt, ttlCutoff()))
        } catch (e) {
            console.error("Error pruning expired chat messages:", e)
        }

        const fullMessage = {
            id: messageId,
            message: trimmed,
            createdAt: new Date(),
            userId,
            username: userRec[0]?.displayName || "Anonymous",
            almaMater: almaMaterVal
        }

        return { success: true, data: fullMessage }
    } catch (error: any) {
        console.error("Error in postRoomMessage:", error)
        return { success: false, error: error.message || "Failed to send message" }
    }
}

// 8. Fetch weekly and overall leaderboards for room members
export async function getRoomLeaderboard(roomId: string, gameWeek: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "Not logged in" }

        // Verify membership
        const memberCheck = await db.select()
            .from(chatRoomMembers)
            .where(
                and(
                    eq(chatRoomMembers.roomId, roomId),
                    eq(chatRoomMembers.userId, session.user.id)
                )
            )
            .limit(1)

        if (memberCheck.length === 0) {
            return { success: false, error: "You are not a member of this room" }
        }

        // Get members lists
        const membersList = await db.select({
            userId: chatRoomMembers.userId,
            name: sql<string>`COALESCE(${users.username}, ${users.name})`,
            almaMater: users.almaMater,
            lifetimePoints: users.lifetimePoints
        })
            .from(chatRoomMembers)
            .innerJoin(users, eq(chatRoomMembers.userId, users.id))
            .where(eq(chatRoomMembers.roomId, roomId))

        const memberIds = membersList.map(m => m.userId)

        const weeklyPointsMap: Record<string, number> = {}
        if (memberIds.length > 0) {
            const lineups = await db.select({
                userId: fantasyLineups.userId,
                pointsEarned: fantasyLineups.pointsEarned
            })
                .from(fantasyLineups)
                .where(
                    and(
                        inArray(fantasyLineups.userId, memberIds),
                        eq(fantasyLineups.gameWeek, gameWeek)
                    )
                )
            lineups.forEach(l => {
                weeklyPointsMap[l.userId] = l.pointsEarned
            })
        }

        const leaderboard = membersList.map(member => ({
            userId: member.userId,
            name: member.name || "Anonymous",
            almaMater: member.almaMater || null,
            weeklyPoints: weeklyPointsMap[member.userId] ?? 0,
            lifetimePoints: member.lifetimePoints ?? 0
        }))

        return { success: true, data: leaderboard }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// 9. Unread message counts per target (global channels + joined rooms) within the last 24h
export async function getUnreadSummary(roomIds: string[] = []) {
    try {
        const session = await auth()
        const userId = session?.user?.id
        if (!userId) return []

        const cutoff = ttlCutoff()
        const summary: { target: string; count: number; latestAt: string }[] = []

        const channelStats = await db.select({
            target: chatMessages.channel,
            count: sql<number>`cast(count(*) as integer)`,
            latestAt: sql<string>`max(${chatMessages.createdAt})`,
        })
            .from(chatMessages)
            .where(and(
                inArray(chatMessages.channel, GLOBAL_CHANNEL_IDS),
                isNull(chatMessages.roomId),
                ne(chatMessages.userId, userId),
                gt(chatMessages.createdAt, cutoff)
            ))
            .groupBy(chatMessages.channel)

        channelStats.forEach(r => {
            summary.push({ target: r.target, count: r.count ?? 0, latestAt: r.latestAt as string })
        })

        if (roomIds.length > 0) {
            const roomStats = await db.select({
                target: chatMessages.roomId,
                count: sql<number>`cast(count(*) as integer)`,
                latestAt: sql<string>`max(${chatMessages.createdAt})`,
            })
                .from(chatMessages)
                .where(and(
                    inArray(chatMessages.roomId, roomIds),
                    ne(chatMessages.userId, userId),
                    gt(chatMessages.createdAt, cutoff)
                ))
                .groupBy(chatMessages.roomId)

            roomStats.forEach(r => {
                if (r.target) summary.push({ target: r.target, count: r.count ?? 0, latestAt: r.latestAt as string })
            })
        }

        GLOBAL_CHANNEL_IDS.forEach(id => {
            if (!summary.some(s => s.target === id)) summary.push({ target: id, count: 0, latestAt: "" })
        })
        roomIds.forEach(id => {
            if (!summary.some(s => s.target === id)) summary.push({ target: id, count: 0, latestAt: "" })
        })

        return summary
    } catch (error) {
        console.error("Error in getUnreadSummary:", error)
        return []
    }
}
