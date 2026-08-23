import { db } from "@/lib/db"
import { smsLogs } from "@/lib/db/schema"
import { inArray, notLike, or } from "drizzle-orm"
import { vynfy } from "@/lib/vynfy-client"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function main() {
    const openRows = await db
        .select()
        .from(smsLogs)
        .where(
            or(
                inArray(smsLogs.status, ["queued", "pending", "sent", "unknown"]),
                notLike(smsLogs.messageId, "msg-%")
            )
        )

    const candidates = openRows.filter((r) => UUID_RE.test(r.messageId))
    console.log(`Found ${openRows.length} unresolved rows, ${candidates.length} with real task IDs\n`)

    const byTask = new Map<string, typeof candidates>()
    for (const row of candidates) {
        const arr = byTask.get(row.messageId) ?? []
        arr.push(row)
        byTask.set(row.messageId, arr)
    }

    let updated = 0
    for (const [taskId, rows] of byTask) {
        const res: any = await vynfy.checkMessageStatus(taskId)
        const msgs: any[] = Array.isArray(res?.data?.messages) ? res.data.messages : []

        if (!msgs.length) {
            console.log(`${taskId.slice(0, 8)}: no status info (${JSON.stringify(res).slice(0, 120)})`)
            continue
        }

        for (const m of msgs) {
            const target = rows.find((r) => r.phone.split(",").map((p) => p.trim()).includes(m.recipient))
            if (!target) continue
            if (m.status && m.status !== target.status) {
                await db.update(smsLogs)
                    .set({ status: m.status, updatedAt: new Date() })
                    .where(inArray(smsLogs.id, [target.id]))
                updated++
                console.log(`${taskId.slice(0, 8)} ${m.recipient}: ${target.status} -> ${m.status}`)
            } else {
                console.log(`${taskId.slice(0, 8)} ${m.recipient}: unchanged (${m.status})`)
            }
        }
    }

    console.log(`\nUpdated ${updated} rows`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
