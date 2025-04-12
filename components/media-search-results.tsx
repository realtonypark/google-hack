"use client"

import { ScrollArea } from "@/components/ui/scroll-area"

interface MediaSearchResultsProps {
  results: any[]
  onSelect: (media: any) => void
}

export default function MediaSearchResults({ results, onSelect }: MediaSearchResultsProps) {
  if (results.length === 0) {
    return null
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <ScrollArea className="h-[300px]">
        <div className="p-1">
          {results.map((result) => (
            <button
              key={result.id}
              className="flex items-center gap-3 w-full p-2 hover:bg-accent rounded-md text-left"
              onClick={() => onSelect(result)}
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
                  {result.type} • {result.year}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
