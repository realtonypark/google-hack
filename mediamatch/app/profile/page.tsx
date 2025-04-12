import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function ProfileRedirect() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  redirect(`/profile/${session.user.username}`)
}
