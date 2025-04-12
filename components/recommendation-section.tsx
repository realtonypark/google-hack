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
  type: "personal" | "broaden" | "friends" | "trending"
}

export default function RecommendationSection({ title, description, type }: RecommendationSectionProps) {
  // Replace useSession with useAuth
  const { user, loading: authLoading } = useAuth()
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Wait for auth to be ready and user to be available
      if (authLoading) return
      
      if (user) {
        setIsLoading(true)
        try {
          const data = await getRecommendations(type)
          setRecommendations(data)
        } catch (error) {
          console.error("Failed to fetch recommendations:", error)
          // Use placeholder data for demo
          setRecommendations(getPlaceholderData(type))
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

// Placeholder data for demo purposes
function getPlaceholderData(type: string) {
  const baseItems = [
    {
      id: "1",
      title: "The Shawshank Redemption",
      type: "movie",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "1994",
      genres: ["Drama"],
    },
    {
      id: "2",
      title: "The Lord of the Rings",
      type: "book",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "1954",
      genres: ["Fantasy", "Adventure"],
    },
    {
      id: "3",
      title: "Breaking Bad",
      type: "series",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "2008",
      genres: ["Crime", "Drama", "Thriller"],
    },
    {
      id: "4",
      title: "Inception",
      type: "movie",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "2010",
      genres: ["Sci-Fi", "Action"],
    },
    {
      id: "5",
      title: "1984",
      type: "book",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "1949",
      genres: ["Dystopian", "Sci-Fi"],
    },
    {
      id: "6",
      title: "Stranger Things",
      type: "series",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "2016",
      genres: ["Horror", "Sci-Fi"],
    },
  ]

  // Modify items based on recommendation type
  if (type === "broaden") {
    return baseItems.map((item) => ({
      ...item,
      title: "Discover: " + item.title,
    }))
  }

  if (type === "friends") {
    return baseItems.map((item) => ({
      ...item,
      recommendedBy: "Jane Doe",
    }))
  }

  if (type === "trending") {
    return baseItems.map((item) => ({
      ...item,
      trending: true,
      trendingRank: Math.floor(Math.random() * 100) + 1,
    }))
  }

  return baseItems
}