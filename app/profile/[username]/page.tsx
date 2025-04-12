// app/profile/[username]/page.tsx
import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/getServerUser"
import { getUserProfile } from "@/lib/api"
import ProfileView from "@/components/profile-view"
import { notFound } from "next/navigation"

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const user = await getServerUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfile(params.username)

  if (!profile) {
    notFound()
  }

  const isOwnProfile = user.username === params.username

  return <ProfileView profile={profile} isOwnProfile={isOwnProfile} />
}