"use client"

import Image from "next/image"
import { useState } from "react"
import { PlusCircle, CheckCircle, Film, BookOpen, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { addToLibrary } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface MediaCardProps {
  media: {
    id: string
    title: string
    type: "movie" | "book" | "series"
    coverImage: string
    year: string
    genres: string[]
    recommendedBy?: string
    trending?: boolean
    trendingRank?: number
  }
}

export default function MediaCard({ media }: MediaCardProps) {
  const [isAdded, setIsAdded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleAddToLibrary = async () => {
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  const getMediaIcon = () => {
    switch (media.type) {
      case "movie":
        return <Film className="h-4 w-4" />
      case "book":
        return <BookOpen className="h-4 w-4" />
      case "series":
        return <Tv className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Card className="w-[250px] overflow-hidden">
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={media.coverImage || "/placeholder.svg"}
          alt={media.title}
          fill
          className="object-cover transition-all hover:scale-105"
        />
        {media.trending && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="opacity-90">
              #{media.trendingRank}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {getMediaIcon()}
            <span className="capitalize">{media.type}</span>
            <span className="mx-1">•</span>
            <span>{media.year}</span>
          </div>
          <h3 className="font-semibold leading-tight">{media.title}</h3>
          <div className="flex flex-wrap gap-1">
            {media.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
          {media.recommendedBy && (
            <p className="text-xs text-muted-foreground pt-1">Recommended by {media.recommendedBy}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          variant={isAdded ? "secondary" : "default"}
          size="sm"
          className="w-full"
          onClick={handleAddToLibrary}
          disabled={isLoading || isAdded}
        >
          {isAdded ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Added
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add to Library
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
