const BASE = "https://sms.vynfy.com"
const KEY = process.env.VYNFY_API_KEY
const PHONE = process.argv[2] || "233594900602"

async function main() {
    const headers = { "X-API-Key": KEY!, "Content-Type": "application/json" }

    console.log("=== OTP balance ===")
    const bal = await fetch(`${BASE}/otp/balance`, { headers })
    console.log(bal.status, await bal.text())

    console.log("\n=== Generate OTP ===")
    const gen = await fetch(`${BASE}/otp/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            medium: "sms",
            number: PHONE,
            otp_type: "numeric",
            length: 6,
            expiry: 10,
            sender_id: "QSTAKEbet",
            message: "Your QSTAKEbet verification code is %otp_code%. Valid for 10 minutes.",
        }),
    })
    const genBody = await gen.text()
    console.log(gen.status, genBody)

    let otpId: string | null = null
    try { otpId = JSON.parse(genBody)?.otp_id?.toString() ?? null } catch {}

    if (!otpId) return

    console.log("\nWaiting 45s, then checking OTP status...\n")
    await new Promise((r) => setTimeout(r, 45000))

    const st = await fetch(`${BASE}/otp/status/${encodeURIComponent(otpId)}`, { headers: { "X-API-Key": KEY! } })
    console.log("OTP status:", st.status, await st.text())
}

main().catch((e) => { console.error(e); process.exit(1) })
