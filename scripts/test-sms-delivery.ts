import { vynfy } from "@/lib/vynfy-client"

const PHONE = process.argv[2] || "233594900602"

async function main() {
    console.log(`Recipient: ${PHONE}\n`)

    const variants = [
        { label: "A: WITH brand (QSTAKEbet)", msg: `Your QSTAKEbet verification code is: 111222. Valid for 10 minutes.` },
        { label: "B: NO brand word", msg: `Your verification code is: 333444. Valid for 10 minutes.` },
    ]

    const tasks: { label: string; taskId: string }[] = []
    for (const v of variants) {
        const res = await vynfy.sendSMS([PHONE], v.msg)
        const taskId = (res.data as any)?.task_id
        console.log(`${v.label} -> success=${res.success} taskId=${taskId}`)
        if (taskId && !String(taskId).startsWith("unparsed")) tasks.push({ label: v.label, taskId })
        await new Promise((r) => setTimeout(r, 1500))
    }

    console.log("\nWaiting 50s before polling delivery status...\n")
    await new Promise((r) => setTimeout(r, 50000))

    for (const t of tasks) {
        const st = await vynfy.checkMessageStatus(t.taskId)
        const msgs = (st.data as any)?.messages
        console.log(`${t.label}:`)
        if (Array.isArray(msgs)) {
            for (const m of msgs) console.log(`   ${m.recipient} -> ${m.status}`)
        } else {
            console.log(JSON.stringify(st, null, 2))
        }
    }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
