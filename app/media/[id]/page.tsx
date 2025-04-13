"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Film, BookOpen, Tv, ListPlus, ListX, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { addToLibrary } from "@/lib/api"
import { MediaItem, MediaEntry } from "@/types/database"
import { Separator } from "@/components/ui/separator"
import { RatingDistribution } from "@/components/rating-distribution"
import { useAuth } from "@/lib/authContext"
import { format } from "date-fns"

export default function MediaDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [media, setMedia] = useState<MediaItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [ratingDistribution, setRatingDistribution] = useState<Record<string, number>>({})
  const [userLog, setUserLog] = useState<MediaEntry | null>(null)

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

        // Fetch user's log if logged in
        if (user) {
          const logResponse = await fetch(`/api/media/${id}/user-log`)
          if (logResponse.ok) {
            const logData = await logResponse.json()
            setUserLog(logData)
          }
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
  }, [id, toast, user])

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

          {userLog && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Your Log</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{format(new Date(userLog.watchedAt), 'MMMM d, yyyy')}</span>
                </div>
                {userLog.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Your Rating:</span>
                    <span>{userLog.rating.toFixed(1)}</span>
                  </div>
                )}
                {userLog.tag && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Tags:</span>
                    <span>{userLog.tag}</span>
                  </div>
                )}
                {userLog.review && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Review:</span>
                    <p className="text-sm">{userLog.review}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-4">
              {!userLog && (
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/add?mediaId=${media.id}`)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Log this
                </Button>
              )}
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
              <h3 className="font-semibold">Community Rating</h3>
              <RatingDistribution distribution={ratingDistribution} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 