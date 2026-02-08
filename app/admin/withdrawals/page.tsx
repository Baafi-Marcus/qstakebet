"use server"

import { db } from "@/lib/db"
import { withdrawalRequests, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import WithdrawalManagementClient from "./WithdrawalManagementClient"

export default async function AdminWithdrawalsPage() {
    const session = await auth();

    // Check admin role
    const userDetails = await db.query.users.findFirst({
        where: eq(users.id, session?.user?.id || ""),
        columns: { role: true }
    });

    if (userDetails?.role !== "admin") {
        redirect("/login");
    }

    // Initial fetch of withdrawals
    const requests = await db.query.withdrawalRequests.findMany({
        orderBy: [desc(withdrawalRequests.createdAt)],
    });

    // Manually attach user details for initial load
    const initialRequests = await Promise.all(requests.map(async (req) => {
        const user = await db.query.users.findFirst({
            where: eq(users.id, req.userId),
            columns: { name: true, phone: true }
        });
        return {
            ...req,
            user: user || { name: "Unknown", phone: "N/A" }
        };
    }));

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Withdrawal Management</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
                        Manual Processing (Paystack Starter Account)
                    </p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Manual Mode Active</span>
                </div>
            </div>

            <WithdrawalManagementClient initialRequests={initialRequests as any} />
        </div>
    )
}
