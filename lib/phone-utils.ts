/**
 * Detects the Mobile Money provider from a Ghanaian phone number
 */
export function detectPaymentMethod(phone: string): "mtn_momo" | "telecel_cash" | "at_money" | null {
    // Standardize to 0XXXXXXXXX format
    const formatted = formatPhoneNumber(phone);
    const prefix = formatted.slice(0, 3);

    // MTN Mobile Money: 024, 025, 053, 054, 055, 059
    if (["024", "025", "053", "054", "055", "059"].includes(prefix)) {
        return "mtn_momo";
    }

    // Telecel Cash (formerly Vodafone): 020, 050
    if (["020", "050"].includes(prefix)) {
        return "telecel_cash";
    }

    // AirtelTigo Money: 026, 027, 056, 057
    if (["026", "027", "056", "057"].includes(prefix)) {
        return "at_money";
    }

    return null;
}

/**
 * Formats a phone number to standard Ghanaian format (0XXXXXXXXX)
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[\s\-+]/g, "");

    // If starts with 233, convert to 0XXXXXXXXX
    if (cleaned.startsWith("233")) {
        return "0" + cleaned.slice(3);
    }

    // If doesn't start with 0, add it
    if (!cleaned.startsWith("0")) {
        return "0" + cleaned;
    }

    return cleaned;
}

/**
 * Formats a phone number to international Ghanaian format (233XXXXXXXXX)
 */
export function formatToInternational(phone: string): string {
    const cleaned = phone.replace(/[\s\-+]/g, "");

    // If starts with 0, replace with 233
    if (cleaned.startsWith("0")) {
        return "233" + cleaned.slice(1);
    }

    // If doesn't start with 233, add it
    if (!cleaned.startsWith("233")) {
        return "233" + cleaned;
    }

    return cleaned;
}

/**
 * Gets a human-readable provider name
 */
export function getProviderName(method: string): string {
    const names: Record<string, string> = {
        "mtn_momo": "MTN Mobile Money",
        "telecel_cash": "Telecel Cash",
        "at_money": "AirtelTigo Money"
    };
    return names[method] || "Mobile Money";
}

/**
 * Validates if a phone number is a valid Ghanaian mobile number
 */
export function isValidGhanaPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s\-+]/g, "");
    const local = cleaned.startsWith("233") ? cleaned.slice(3) : cleaned;

    // Must be 10 digits starting with 0, or 9 digits without 0
    if (local.startsWith("0")) {
        return local.length === 10 && /^0[2-5][0-9]{8}$/.test(local);
    }
    return local.length === 9 && /^[2-5][0-9]{8}$/.test(local);
}
