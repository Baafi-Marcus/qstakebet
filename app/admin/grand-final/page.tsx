import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminGFClient from "./AdminGFClient"

export default async function AdminGrandFinalPage() {
    const session = await auth()
    if (session?.user?.role !== "admin") {
        redirect("/admin/login")
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-black mb-6">Grand Final Management</h1>
            <p className="text-muted-foreground mb-8 text-sm">
                Lock predictions and trigger scoring for the Ultimate NSMQ Predictor stage.
            </p>

            <AdminGFClient />
        </div>
    )
}
