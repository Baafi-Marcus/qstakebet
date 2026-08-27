import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminSFClient from "./AdminSFClient"

export default async function AdminSemiFinalPage() {
    const session = await auth()
    if (session?.user?.role !== "admin") {
        redirect("/admin/login")
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-black mb-6">Semi-Finals Management</h1>
            <p className="text-muted-foreground mb-8 text-sm">
                Lock predictions and trigger scoring for the Semi-Final Confidence Challenge.
            </p>

            <AdminSFClient />
        </div>
    )
}
