// app/page.tsx
import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/getServerUser"
import HomeFeed from "@/components/home-feed"

export default async function Home() {
  const user = await getServerUser()

  if (!user) {
    redirect("/login")
  }

  return <HomeFeed />
}