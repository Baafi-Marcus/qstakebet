import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { like, or } from "drizzle-orm";

export async function GET() {
    try {
        const testUsers = await db.select().from(users).where(
            or(
                like(users.name, '%test%'),
                like(users.name, '%Test%'),
                like(users.email, '%test%')
            )
        );

        if (testUsers.length === 0) {
            return NextResponse.json({ message: "No test users found" });
        }

        const ids = testUsers.map(u => u.id);
        
        // Hide them from leaderboards by resetting their fantasy points
        // Or we could delete them entirely, but Drizzle delete might fail on FK constraints (predictions, chat messages)
        // Best approach: set totalFantasyPoints to 0 and role to 'banned' or 'suspended'
        // For complete removal from leaderboard:
        // Or if the user really means "remove", maybe we can just set their points to 0.

        return NextResponse.json({ testUsers: testUsers.map(u => ({id: u.id, name: u.name, points: u.totalFantasyPoints})) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
