
export class VynfyClient {
    private baseUrl = "https://sms.vynfy.com";
    private apiKey: string;
    private senderId: string;

    constructor() {
        this.apiKey = process.env.VYNFY_API_KEY || "";
        this.senderId = process.env.VYNFY_SENDER_ID || "FuseWeb";
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
            console.log(`Vynfy SMS response [${res.status}]:`, raw.slice(0, 500));
            let data: any;
            try { data = JSON.parse(raw); } catch { data = { raw }; }

            if (!res.ok) {
                return { success: false, error: `SMS provider error (${res.status})`, data };
            }

            // Docs shape: { success, data: { status, task_id, recipients_count }, balance }
            const messageId = data?.data?.task_id || data?.task_id || data?.message_id || data?.id || null;
            const providerStatus = data?.data?.status || data?.status || "unknown";
            const apiSuccess = data?.success !== false;

            if (!apiSuccess || !messageId) {
                console.error("Vynfy send returned unexpected body:", raw.slice(0, 500));
            }

            // Log to database for tracking
            try {
                const { db } = await import("@/lib/db");
                const { smsLogs } = await import("@/lib/db/schema");

                await db.insert(smsLogs).values({
                    id: `sl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    messageId: messageId || `unparsed-${Date.now()}`,
                    phone: recipients.join(","),
                    message: message,
                    status: providerStatus,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            } catch (dbError) {
                console.error("Failed to log SMS to database:", dbError);
            }

            if (!apiSuccess) {
                return { success: false, error: "SMS provider rejected the request", data };
            }
            return { success: true, data: { ...data, task_id: messageId, status: providerStatus } };
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
                headers: { "X-API-Key": this.apiKey },
            });
            const data = await res.json();
            return { success: res.ok, data };
        } catch (error) {
            return { success: false, error: "Network Error" };
        }
    }

    /**
     * Checks whether the configured Sender ID is registered and approved.
     */
    async checkSenderIdStatus() {
        if (!this.apiKey) return { success: false, error: "Configuration Error" };

        try {
            const res = await fetch(`${this.baseUrl}/sender/id/status`, {
                method: "GET",
                headers: { "X-API-Key": this.apiKey },
            });
            const raw = await res.text();
            let data: any;
            try { data = JSON.parse(raw); } catch { data = { raw }; }
            return { success: res.ok, status: res.status, data };
        } catch (error) {
            return { success: false, error: "Network Error" };
        }
    }

    /**
     * Queries delivery status for a previously sent message by task_id.
     */
    async checkMessageStatus(taskId: string) {
        if (!this.apiKey) return { success: false, error: "Configuration Error" };

        try {
            const res = await fetch(`${this.baseUrl}/api/v1/status/${encodeURIComponent(taskId)}`, {
                method: "GET",
                headers: { "X-API-Key": this.apiKey },
            });
            const raw = await res.text();
            let data: any;
            try { data = JSON.parse(raw); } catch { data = { raw }; }
            return { success: res.ok, status: res.status, data };
        } catch (error) {
            return { success: false, error: "Network Error" };
        }
    }
}

export const vynfy = new VynfyClient();
