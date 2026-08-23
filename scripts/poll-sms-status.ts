import { vynfy } from "@/lib/vynfy-client"

const IDS = [
    "6afc98b0-12d7-4010-a6e9-6083c77c1845",
    "9a80556d-9946-4167-8594-68c51bd48b7b",
    "8edd5669-af9c-4ca3-bad2-27536c62e89c",
]

async function main() {
    for (const id of IDS) {
        const st: any = await vynfy.checkMessageStatus(id)
        const msgs = st?.data?.messages
        console.log(id.slice(0, 8) + ": " + (Array.isArray(msgs) ? msgs.map((m: any) => `${m.recipient}->${m.status}`).join(", ") : JSON.stringify(st)))
    }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
