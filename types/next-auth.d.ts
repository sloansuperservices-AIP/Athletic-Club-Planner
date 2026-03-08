import type { Role } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      role: Role
      orgId: string
    }
  }

  interface User {
    role?: Role
    orgId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role
    orgId?: string
    userId?: string
  }
}
