import { db } from "@/lib/db"
import { smsLogs } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { vynfy } from "@/lib/vynfy-client"

async function main() {
    const logs = await db.select().from(smsLogs).orderBy(desc(smsLogs.createdAt)).limit(5)
    console.log(`=== Last ${logs.length} SMS log entries ===`)
    for (const l of logs) {
        console.log({
            id: l.id,
            phone: l.phone,
            messageId: l.messageId,
            status: l.status,
            message: l.message.slice(0, 60),
            createdAt: l.createdAt,
        })
    }

    console.log("\n=== Balance ===")
    console.log(JSON.stringify(await vynfy.checkBalance(), null, 2))

    console.log("\n=== Sender ID status ===")
    console.log(JSON.stringify(await vynfy.checkSenderIdStatus(), null, 2))

    const realTask = logs.find((l) => l.messageId && !l.messageId.startsWith("msg-") && !l.messageId.startsWith("unparsed-"))
    if (realTask) {
        console.log(`\n=== Delivery status for ${realTask.messageId} (to ${realTask.phone}) ===`)
        console.log(JSON.stringify(await vynfy.checkMessageStatus(realTask.messageId), null, 2))
    }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
