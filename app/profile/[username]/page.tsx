import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getUserProfile } from "@/lib/api"
import ProfileView from "@/components/profile-view"
import { notFound } from "next/navigation"

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const profile = await getUserProfile(params.username)

  if (!profile) {
    notFound()
  }

  const isOwnProfile = session.user.username === params.username

  return <ProfileView profile={profile} isOwnProfile={isOwnProfile} />
}
