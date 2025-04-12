"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Film, BookOpen, Tv } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { addToLibrary } from "@/lib/api"
import { MediaItem } from "@/types/database"

export default function MediaDetailPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const [media, setMedia] = useState<MediaItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdded, setIsAdded] = useState(false)

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch(`/api/media/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch media')
        }
        const data = await response.json()
        setMedia(data)
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

  const handleAddToLibrary = async () => {
    if (!media) return
    
    try {
      await addToLibrary(media.id)
      setIsAdded(true)
      toast({
        title: "Added to library",
        description: `${media.title} has been added to your library.`,
      })
    } catch (error) {
      console.error("Failed to add to library:", error)
      toast({
        title: "Failed to add",
        description: "There was an error adding this to your library.",
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

          <Button
            variant={isAdded ? "secondary" : "default"}
            size="lg"
            onClick={handleAddToLibrary}
            disabled={isAdded}
          >
            {isAdded ? "Added to Library" : "Add to Library"}
          </Button>
        </div>
      </div>
    </div>
  )
} 