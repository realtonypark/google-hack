"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { MediaItem } from "@/types/database"

interface MediaSearchResultsProps {
  results: MediaItem[]
  onSelect?: (media: MediaItem) => void
}

export default function MediaSearchResults({ results, onSelect }: MediaSearchResultsProps) {
  const router = useRouter()

  if (results.length === 0) {
    return null
  }

  const handleClick = (media: MediaItem) => {
    if (onSelect) {
      onSelect(media)
    } else {
      router.push(`/media/${media.id}`)
    }
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <ScrollArea className="h-[300px]">
        <div className="p-1">
          {results.map((result) => (
            <button
              key={result.id}
              className="flex items-center gap-3 w-full p-2 hover:bg-accent rounded-md text-left"
              onClick={() => handleClick(result)}
            >
              <div className="w-10 h-14 relative overflow-hidden rounded">
                <img
                  src={result.coverImage || "/placeholder.svg"}
                  alt={result.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <h3 className="font-medium">{result.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {result.type} • {result.releaseDate ? new Date(result.releaseDate).getFullYear() : 'N/A'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
