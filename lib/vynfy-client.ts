
export class VynfyClient {
    private baseUrl = "https://sms.vynfy.com";
    private apiKey: string;
    private senderId: string;

    constructor() {
        this.apiKey = process.env.VYNFY_API_KEY || "";
        this.senderId = process.env.VYNFY_SENDER_ID || "QSTAKEbet";
    }

    /**
     * Sends a generic SMS to a list of recipients.
     */
    async sendSMS(recipients: string[], message: string) {
        if (!this.apiKey) {
            console.error("Vynfy SMS failed: VYNFY_API_KEY env var is not configured on this deployment")
            return { success: false, error: "SMS service is not configured" };
        }

        try {
            const res = await fetch(`${this.baseUrl}/api/v1/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.apiKey,
                },
                body: JSON.stringify({
                    sender: this.senderId,
                    recipients: recipients,
                    message: message,
                }),
            });

            const raw = await res.text();
            let data: any;
            try { data = JSON.parse(raw); } catch { data = { raw }; }

            if (!res.ok) {
                console.error(`Vynfy SMS failed with status ${res.status}:`, raw.slice(0, 500));
                return { success: false, error: `SMS provider error (${res.status})`, data };
            }

            // Log to database for tracking
            try {
                const { db } = await import("@/lib/db");
                const { smsLogs } = await import("@/lib/db/schema");

                // Use message_id from Vynfy if present
                const messageId = data.message_id || data.id || `msg-${Date.now()}`;

                await db.insert(smsLogs).values({
                    id: `sl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    messageId: messageId,
                    phone: recipients.join(","),
                    message: message,
                    status: data.status || "pending",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            } catch (dbError) {
                console.error("Failed to log SMS to database:", dbError);
            }

            return { success: true, data };
        } catch (error) {
            console.error("Vynfy Send SMS Error:", error);
            return { success: false, error: "Network Error" };
        }
    }

    /**
     * Checks the SMS balance.
     */
    async checkBalance() {
        if (!this.apiKey) return { success: false, error: "Configuration Error" };

        try {
            const res = await fetch(`${this.baseUrl}/api/v1/check/balance`, {
                method: "GET",
                headers: {
                    "X-API-Key": this.apiKey, // Based on docs, usually header
                },
            });
            const data = await res.json();
            return { success: res.ok, data };
        } catch (error) {
            return { success: false, error: "Network Error" };
        }
    }
}

export const vynfy = new VynfyClient();
