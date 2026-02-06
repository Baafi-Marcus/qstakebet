import "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: string
            phone: string
            email: string
            name?: string | null
        }
    }

    interface User {
        id: string
        role: string
        phone: string
        email: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: string
        phone: string
    }
}
