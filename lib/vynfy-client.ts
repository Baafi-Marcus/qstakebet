
export class VynfyClient {
    private baseUrl = "https://sms.vynfy.com";
    private apiKey: string;
    private senderId: string;

    constructor() {
        this.apiKey = process.env.VYNFY_API_KEY || "";
        this.senderId = process.env.VYNFY_SENDER_ID || "QSTAKE";
    }

    /**
     * Sends a generic SMS to a list of recipients.
     */
    async sendSMS(recipients: string[], message: string) {
        if (!this.apiKey) {
            console.error("Vynfy API Key missing");
            return { success: false, error: "Configuration Error" };
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

            const data = await res.json();
            return { success: res.ok, data };
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
