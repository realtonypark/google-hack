// app/profile/page.tsx
import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/getServerUser"

export default async function ProfileRedirect() {
  const user = await getServerUser()

  if (!user) {
    redirect("/login")
  }

  redirect(`/profile/${user.username}`)
}