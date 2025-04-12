"use client"

import { useState } from "react"
import { useAuth } from "@/lib/authContext"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import RecommendationSection from "@/components/recommendation-section"

export default function HomeFeed() {
  // Replace useSession with useAuth
  const { user, loading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  // Add a loading state while authentication is initializing
  if (loading) {
    return <div className="container py-6 flex justify-center">Loading...</div>
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for books, movies or TV shows..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="for-you" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
        <TabsContent value="for-you" className="space-y-8 mt-6">
          <RecommendationSection title="Your Picks" description="Recommended based on your library" type="personal" />
          <RecommendationSection
            title="Broaden Your Taste"
            description="Explore beyond your usual genres"
            type="broaden"
          />
          {/* Conditionally show this section if user has friends */}
          <RecommendationSection
            title="Popular Among Friends"
            description="What your connections are enjoying"
            type="friends"
          />
        </TabsContent>
        <TabsContent value="trending" className="space-y-8 mt-6">
          <RecommendationSection title="Trending Now" description="Popular across the platform" type="trending" />
        </TabsContent>
      </Tabs>
    </div>
  )
}