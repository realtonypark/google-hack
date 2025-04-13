"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Film, BookOpen, Tv, ListPlus, ListX, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { addToLibrary } from "@/lib/api"
import { MediaItem } from "@/types/database"
import { Rating } from "@/components/ui/rating"
import { Separator } from "@/components/ui/separator"
import { RatingDistribution } from "@/components/rating-distribution"

export default function MediaDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [media, setMedia] = useState<MediaItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRating, setUserRating] = useState(0)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [ratingDistribution, setRatingDistribution] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch(`/api/media/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch media')
        }
        const data = await response.json()
        setMedia(data)

        // Fetch rating distribution
        const distributionResponse = await fetch(`/api/media/${id}/ratings`)
        if (distributionResponse.ok) {
          const distributionData = await distributionResponse.json()
          setRatingDistribution(distributionData.distribution)
        }
      } catch (error) {
        console.error('Error fetching media:', error)
        toast({
          title: "Error",
          description: "Failed to load media details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedia()
  }, [id, toast])

  const handleRatingChange = async (rating: number) => {
    try {
      const response = await fetch(`/api/media/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      })

      if (!response.ok) {
        throw new Error('Failed to update rating')
      }

      setUserRating(rating)
      toast({
        title: "Rating updated",
        description: "Your rating has been saved",
      })
    } catch (error) {
      console.error('Error updating rating:', error)
      toast({
        title: "Error",
        description: "Failed to update rating",
        variant: "destructive",
      })
    }
  }

  const toggleWatchlist = async () => {
    try {
      const response = await fetch(`/api/media/${id}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ add: !inWatchlist }),
      })

      if (!response.ok) {
        throw new Error('Failed to update watchlist')
      }

      setInWatchlist(!inWatchlist)
      toast({
        title: inWatchlist ? "Removed from watchlist" : "Added to watchlist",
        description: `${media?.title} has been ${inWatchlist ? 'removed from' : 'added to'} your watchlist`,
      })
    } catch (error) {
      console.error('Error updating watchlist:', error)
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      })
    }
  }

  const getMediaIcon = () => {
    if (!media) return null
    switch (media.type) {
      case "movie":
        return <Film className="h-6 w-6" />
      case "book":
        return <BookOpen className="h-6 w-6" />
      case "tv":
        return <Tv className="h-6 w-6" />
      default:
        return null
    }
  }

  if (isLoading) {
    return <div className="container py-6 flex justify-center">Loading...</div>
  }

  if (!media) {
    return <div className="container py-6 text-center">Media not found</div>
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="relative aspect-[2/3] w-full max-w-md self-start">
          <Image
            src={media.coverImage || "/placeholder.svg"}
            alt={media.title}
            fill
            className="object-cover rounded-lg"
          />
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              {getMediaIcon()}
              <span className="capitalize">{media.type}</span>
              {media.releaseDate && (
                <>
                  <span>•</span>
                  <span>{new Date(media.releaseDate).getFullYear()}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold">{media.title}</h1>
            
            <div className="flex flex-wrap gap-2">
              {media.genres.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                className="flex-1"
                onClick={() => router.push(`/add?mediaId=${media.id}`)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Log this
              </Button>
              <Button
                variant={inWatchlist ? "outline" : "default"}
                className="flex-1"
                onClick={toggleWatchlist}
              >
                {inWatchlist ? (
                  <>
                    <ListX className="mr-2 h-4 w-4" />
                    Remove from Watchlist
                  </>
                ) : (
                  <>
                    <ListPlus className="mr-2 h-4 w-4" />
                    Add to Watchlist
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Your Rating</h2>
              <Rating value={userRating} onChange={handleRatingChange} />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">MediaMatch Rating</h2>
                <span className="text-2xl font-bold text-yellow-400">
                  {Object.keys(ratingDistribution).length > 0 ? 
                    (Object.entries(ratingDistribution).reduce((acc, [rating, count]) => 
                      acc + (parseFloat(rating) * count), 0) / 
                      Object.values(ratingDistribution).reduce((a, b) => a + b, 0)
                    ).toFixed(1) : 
                    '--'
                  }
                </span>
              </div>
              {Object.keys(ratingDistribution).length > 0 ? (
                <div className="pt-2">
                  <RatingDistribution 
                    distribution={ratingDistribution}
                    totalRatings={Object.values(ratingDistribution).reduce((a, b) => a + b, 0)}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No ratings yet • Be the first to rate
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Community Rating (TMDB)</h2>
                <span className="text-2xl font-bold text-yellow-400">
                  {media.rating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {media.totalRatings} ratings
              </p>
            </div>

            <Separator />
          </div>

          <div className="space-y-4">
            {media.description && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{media.description}</p>
              </div>
            )}

            {media.authors && media.authors.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Authors</h2>
                <p className="text-muted-foreground">{media.authors.join(", ")}</p>
              </div>
            )}

            {media.directors && media.directors.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Directors</h2>
                <p className="text-muted-foreground">{media.directors.join(", ")}</p>
              </div>
            )}

            {media.cast && media.cast.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Cast</h2>
                <p className="text-muted-foreground">{media.cast.join(", ")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 