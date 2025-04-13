// app/profile/[username]/page.tsx
import { redirect, notFound } from "next/navigation"
import { getServerUser } from "@/lib/getServerUser"
import { getUserProfile } from "@/lib/api"
import ProfileView from "@/components/profile-view"

export const dynamic = "force-dynamic"

type Params = {
  username: string
}

export default async function ProfilePage({ params }: { params: Promise<Params> }) {
  const { username } = await params

  const user = await getServerUser()
  if (!user) redirect("/login")

  // Use the UID from the URL path
  const uid = username
  const profile = await getUserProfile(uid)
  if (!profile) notFound()

  const isOwnProfile = user.id === uid

  return <ProfileView profile={profile} isOwnProfile={isOwnProfile} />
}