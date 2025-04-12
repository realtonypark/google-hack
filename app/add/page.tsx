// app/add/page.tsx
import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/getServerUser"
import AddMediaForm from "@/components/add-media-form"

export default async function AddMediaPage() {
  const user = await getServerUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8">Add to Your Library</h1>
      <AddMediaForm />
    </div>
  )
}