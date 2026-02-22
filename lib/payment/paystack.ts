"use server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function initiatePaystackTransaction(data: {
    amount: number;
    email: string;
    reference: string;
    callback_url?: string;
}) {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("PAYSTACK_SECRET_KEY is not defined");
        return { success: false, error: "Payment gateway configuration error" };
    }

    try {
        const response = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: Math.round(data.amount * 100), // Convert to pesewas/cents
                email: data.email,
                reference: data.reference,
                callback_url: data.callback_url || `${process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/account/deposit/callback`,
                metadata: {
                    reference: data.reference,
                },
            }),
        });

        const result = await response.json();

        if (result.status) {
            return {
                success: true,
                authorization_url: result.data.authorization_url,
                access_code: result.data.access_code,
                reference: result.data.reference,
            };
        } else {
            console.error("Paystack initialization failed:", result.message);
            return { success: false, error: result.message };
        }
    } catch (error) {
        console.error("Paystack error:", error);
        return { success: false, error: "Failed to connect to payment gateway" };
    }
}

export async function verifyPaystackTransaction(reference: string) {
    if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: "Payment gateway configuration error" };
    }

    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();

        if (result.status && result.data.status === "success") {
            return {
                success: true,
                amount: result.data.amount / 100,
                reference: result.data.reference,
                payload: result.data,
            };
        } else {
            return { success: false, error: result.message || "Transaction not successful" };
        }
    } catch (error) {
        console.error("Paystack verification error:", error);
        return { success: false, error: "Failed to verify transaction" };
    }
}
