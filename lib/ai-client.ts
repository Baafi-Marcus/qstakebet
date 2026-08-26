import { getActiveKey, reportKeyError } from "./ai-key-manager"

// Provider priority order: least-used active key from the first healthy pool wins.
// Auth/rate-limit failures rotate keys within the pool, then fall through to the next provider.
const PROVIDER_ORDER = ["gemini", "github_models", "openai"] as const

const GEMINI_MODEL = "gemini-3.5-flash"
const OPENAI_COMPAT_MODELS: Record<string, string> = {
    github_models: "openai/gpt-4o",
    openai: "gpt-4o",
}

type LLMResponse =
    | { ok: true, content: string }
    | { ok: false, error: string }

async function callGemini(token: string, prompt: string, temperature: number): Promise<{ content?: string, retryableAuth: boolean, hardFail: boolean }> {
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${token}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.timeout(60000),
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature, responseMimeType: "application/json" }
                })
            }
        )
        if (!res.ok) {
            const authFail = res.status === 401 || res.status === 403 || res.status === 429
            console.warn(`Gemini request failed with ${res.status}`)
            return { retryableAuth: authFail, hardFail: false }
        }
        const data = await res.json() as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        }
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
        if (!content) return { retryableAuth: false, hardFail: true }
        return { content, retryableAuth: false, hardFail: false }
    } catch (error: any) {
        if (error?.name === "AbortError") console.warn("Gemini request timed out")
        else console.warn("Gemini network error:", error?.message || error)
        return { retryableAuth: true, hardFail: false } // network issues are worth rotating over
    }
}

async function callOpenAICompatible(provider: string, token: string, prompt: string, temperature: number): Promise<{ content?: string, retryableAuth: boolean, hardFail: boolean }> {
    const endpoint = provider === "openai"
        ? "https://api.openai.com/v1/chat/completions"
        : "https://models.github.ai/inference/chat/completions"
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            signal: AbortSignal.timeout(60000),
            body: JSON.stringify({
                messages: [{ role: "user", content: prompt }],
                model: OPENAI_COMPAT_MODELS[provider],
                temperature,
                response_format: { type: "json_object" }
            })
        })
        if (!res.ok) {
            const authFail = res.status === 401 || res.status === 403 || res.status === 429
            console.warn(`${provider} request failed with ${res.status}`)
            return { retryableAuth: authFail, hardFail: false }
        }
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
        const content = data.choices?.[0]?.message?.content?.trim() || ""
        if (!content) return { retryableAuth: false, hardFail: true }
        return { content, retryableAuth: false, hardFail: false }
    } catch (error: any) {
        console.warn(`${provider} network error:`, error?.message || error)
        return { retryableAuth: true, hardFail: false }
    }
}

/**
 * Calls an LLM with automatic cross-provider rotation.
 * Tries gemini first, then github_models, then openai — whichever has healthy keys.
 * Returns raw JSON-string content (callers parse).
 */
export async function callLLM(opts: { prompt: string, temperature?: number }): Promise<LLMResponse> {
    const temperature = opts.temperature ?? 0.1
    let lastError = "No AI API keys available"

    for (const provider of PROVIDER_ORDER) {
        for (let attempt = 0; attempt < 2; attempt++) {
            const token = await getActiveKey(provider)
            if (!token) break // no keys in this pool, move to next provider

            const r = provider === "gemini"
                ? await callGemini(token, opts.prompt, temperature)
                : await callOpenAICompatible(provider, token, opts.prompt, temperature)

            if (r.content) return { ok: true, content: r.content }

            if (r.hardFail) {
                lastError = `${provider} returned empty response`
                break // don't burn another key on an empty-response problem
            }

            if (r.retryableAuth) {
                await reportKeyError(token)
                lastError = `${provider} key failed, rotating`
                continue
            }

            lastError = `${provider} request failed`
            break
        }
    }

    return { ok: false, error: lastError }
}
