import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Retest exact-casing FuseWeb sender ID after dashboard approval.
const PHONE = process.argv[2] || "233594900602";

async function main() {
    const apiKey = process.env.VYNFY_API_KEY;
    if (!apiKey) throw new Error("No VYNFY_API_KEY");
    const SENDER = "FuseWeb";

    // 1. Status check
    const st = await fetch(`https://sms.vynfy.com/sender/id/status?sender_name=${encodeURIComponent(SENDER)}`, {
        headers: { "X-API-Key": apiKey },
    });
    console.log("Status:", st.status, (await st.text()).slice(0, 300));

    // 2. Send
    const res = await fetch("https://sms.vynfy.com/api/v1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({
            sender: SENDER,
            recipients: [PHONE],
            message: `QSTAKEfantasy test via new FuseWeb sender ID. Ignore this message.`,
        }),
    });
    const raw = await res.text();
    console.log(`Send [${res.status}]:`, raw.slice(0, 400));
    let data: any;
    try { data = JSON.parse(raw); } catch { data = {}; }
    const taskId = data?.data?.task_id || data?.task_id;
    if (!taskId) {
        console.log("No task_id — aborting poll.");
        process.exit(1);
    }

    // 3. Poll delivery 5x every 30s
    console.log(`task_id: ${taskId} | polling...\n`);
    for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 30000));
        const s2 = await fetch(`https://sms.vynfy.com/api/v1/status/${encodeURIComponent(String(taskId))}`, {
            headers: { "X-API-Key": apiKey },
        });
        console.log(`[${i + 1}/5] ${new Date().toISOString()}:`, (await s2.text()).slice(0, 500));
    }
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1) })
