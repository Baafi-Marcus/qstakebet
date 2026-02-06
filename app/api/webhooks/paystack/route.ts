import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { confirmDeposit } from "@/lib/payment-actions"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const hash = crypto
            .createHmac("sha512", PAYSTACK_SECRET_KEY!)
            .update(body)
            .digest("hex")

        const signature = req.headers.get("x-paystack-signature")

        // 1. Verify signature
        if (hash !== signature) {
            console.error("Invalid Paystack Webhook Signature")
            return new NextResponse("Invalid Signature", { status: 401 })
        }

        const event = JSON.parse(body)

        // 2. Handle successful charge
        if (event.event === "charge.success") {
            const reference = event.data.reference
            console.log(`Processing successful Paystack charge: ${reference}`)

            const result = await confirmDeposit(reference)
            if (result.success) {
                return NextResponse.json({ status: "success" })
            } else {
                console.error(`Failed to confirm deposit via webhook: ${result.error}`)
                return new NextResponse("Confirmation Failed", { status: 500 })
            }
        }

        return NextResponse.json({ status: "ignored" })
    } catch (error) {
        console.error("Webhook processing error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
