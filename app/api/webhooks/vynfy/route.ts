import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { smsLogs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
    try {
        const payload = await req.json()
        console.log("Vynfy Webhook received:", payload)

        // Attempt to extract message ID and status from payload
        // Vynfy documentation wasn't fully accessible, so we handle common patterns
        const messageId = payload.message_id || payload.messageId || payload.id
        const status = payload.status || payload.delivery_status
        const error = payload.error || payload.error_message || payload.message

        if (messageId) {
            // Update the log entry if it exists
            await db.update(smsLogs)
                .set({
                    status: status === "delivered" || status === "success" || status === "DELIVRD" ? "delivered" : "failed",
                    error: error || null,
                    updatedAt: new Date()
                })
                .where(eq(smsLogs.messageId, messageId))

            console.log(`Updated SMS log status for ${messageId} to ${status}`)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Vynfy Webhook Error:", error)
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }
}
