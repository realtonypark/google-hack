declare module "next-auth" {
  interface User {
    id: string
    username?: string
  }

  interface Session {
    user: User & {
      username?: string
    }
  }
}
