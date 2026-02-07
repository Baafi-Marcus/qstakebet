/**
 * Paystack Transfer Client for Mobile Money Withdrawals
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface TransferRecipient {
    recipient_code: string;
    type: string;
    name: string;
    details: {
        account_number: string;
        bank_code: string;
    };
}

interface TransferResponse {
    status: boolean;
    message: string;
    data?: {
        transfer_code: string;
        reference: string;
        status: string;
        amount: number;
    };
}

export class PaystackClient {
    private headers = {
        "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
    };

    /**
     * Creates a transfer recipient for mobile money
     */
    async createRecipient(name: string, phone: string, provider: string): Promise<{ success: boolean; recipientCode?: string; error?: string }> {
        try {
            // Map provider to Paystack bank code
            const bankCode = this.getProviderBankCode(provider);
            if (!bankCode) {
                return { success: false, error: "Unsupported provider" };
            }

            const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    type: "mobile_money",
                    name: name,
                    account_number: phone,
                    bank_code: bankCode,
                    currency: "GHS"
                })
            });

            const data = await response.json();

            if (data.status && data.data) {
                return { success: true, recipientCode: data.data.recipient_code };
            }

            return { success: false, error: data.message || "Failed to create recipient" };
        } catch (error) {
            console.error("Paystack create recipient error:", error);
            return { success: false, error: "Network error" };
        }
    }

    /**
     * Initiates a transfer to a mobile money account
     */
    async initiateTransfer(
        recipientCode: string,
        amount: number,
        reference: string,
        reason?: string
    ): Promise<TransferResponse> {
        try {
            // Paystack expects amount in kobo (pesewas for GHS)
            const amountInPesewas = Math.round(amount * 100);

            const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    source: "balance",
                    amount: amountInPesewas,
                    recipient: recipientCode,
                    reference: reference,
                    reason: reason || "Withdrawal from QSTAKEbet"
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Paystack transfer error:", error);
            return {
                status: false,
                message: "Network error occurred"
            };
        }
    }

    /**
     * Verifies a transfer status
     */
    async verifyTransfer(reference: string): Promise<{ success: boolean; status?: string; error?: string }> {
        try {
            const response = await fetch(`${PAYSTACK_BASE_URL}/transfer/verify/${reference}`, {
                method: "GET",
                headers: this.headers
            });

            const data = await response.json();

            if (data.status && data.data) {
                return { success: true, status: data.data.status };
            }

            return { success: false, error: data.message };
        } catch (error) {
            console.error("Paystack verify error:", error);
            return { success: false, error: "Network error" };
        }
    }

    /**
     * Maps internal provider codes to Paystack bank codes
     */
    private getProviderBankCode(provider: string): string | null {
        const codes: Record<string, string> = {
            "mtn_momo": "MTN",
            "telecel_cash": "VOD", // Vodafone/Telecel
            "at_money": "ATL" // AirtelTigo
        };
        return codes[provider] || null;
    }
}

export const paystackClient = new PaystackClient();
