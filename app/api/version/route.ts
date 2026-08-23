import { NextResponse } from "next/server"

export async function GET() {
    return NextResponse.json({
        commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
        deployedAt: new Date().toISOString(),
        vynfyKeyPresent: !!process.env.VYNFY_API_KEY,
    })
}
