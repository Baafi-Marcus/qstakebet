"use server"

const MOOLRE_API_URL = "https://api.moolre.com";
const MOOLRE_PRIVATE_KEY = process.env.MOOLRE_PRIVATE_KEY;
const MOOLRE_PUBLIC_KEY = process.env.MOOLRE_PUBLIC_KEY;

/**
 * Utility to make requests to Moolre API
 */
export async function moolreRequest(endpoint: string, method: string, body?: any) {
    if (!MOOLRE_PRIVATE_KEY || !MOOLRE_PUBLIC_KEY) {
        throw new Error("Moolre API keys are not configured in environment variables.");
    }

    try {
        const response = await fetch(`${MOOLRE_API_URL}${endpoint}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": MOOLRE_PRIVATE_KEY,
                "X-API-PUBKEY": MOOLRE_PUBLIC_KEY,
            },
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store'
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Moolre API Error:", data);
            return { success: false, error: data.message || "Moolre API request failed" };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Moolre Request Exception:", error);
        return { success: false, error: "Network error or invalid response" };
    }
}

/**
 * Initiate a deposit (Collection)
 */
export async function initiateMomoDeposit({
    amount,
    phoneNumber,
    network,
    customerName,
    customerEmail,
    reference
}: {
    amount: number;
    phoneNumber: string;
    network: 'mtn' | 'telecel' | 'at';
    customerName: string;
    customerEmail: string;
    reference: string;
}) {
    // Moolre payload structure (standard for MOMO collections)
    const payload = {
        amount,
        currency: "GHS",
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: phoneNumber,
        network: network.toUpperCase(),
        reference,
        callback_url: `${process.env.NEXTAUTH_URL}/api/webhooks/moolre`,
        description: `Deposit of GHS ${amount} to QSTAKEbet wallet`
    };

    return await moolreRequest("/v1/payments/collect", "POST", payload);
}
