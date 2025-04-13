"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/authContext"
import { getRecommendations } from "@/lib/api"
import MediaCard from "@/components/media-card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface RecommendationSectionProps {
  title: string
  description: string
  type: "personal" | "broaden"
}

export default function RecommendationSection({ title, description, type }: RecommendationSectionProps) {
  // Replace useSession with useAuth
  const { user, loading: authLoading } = useAuth()
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("🧩 useEffect triggered", { user, authLoading })

    const fetchRecommendations = async () => {
      console.log("📡 inside fetchRecommendations")
      // Wait for auth to be ready and user to be available
      if (authLoading) return
      if (user) {
        setIsLoading(true)
        try {
          const data = await getRecommendations(type, user.uid)
          console.log("💡 Recommendations for", type, "=>", data)
          setRecommendations(data)
        } catch (error) {
          console.error("Failed to fetch recommendations:", error)
          // Use placeholder data for demo
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchRecommendations()
  }, [user, authLoading, type])

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex w-max space-x-4 p-1">
          {isLoading || authLoading
            ? Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="w-[250px]">
                    <Skeleton className="h-[300px] w-[250px] rounded-xl" />
                    <div className="space-y-2 mt-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))
            : recommendations.map((item) => <MediaCard key={item.id} media={item} />)}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}

