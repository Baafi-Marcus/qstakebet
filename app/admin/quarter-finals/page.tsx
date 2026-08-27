import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminQFClient from "./AdminQFClient"

export default async function AdminQuarterFinalsPage() {
    const session = await auth()
    if (session?.user?.role !== "admin") {
        redirect("/admin/login")
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-black mb-6">Quarter-Finals Management</h1>
            <p className="text-muted-foreground mb-8 text-sm">
                Lock predictions and trigger scoring for the Quarter-Final Fantasy stage.
            </p>

            <AdminQFClient />
        </div>
    )
}
