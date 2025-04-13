"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { addMediaToLibrary } from "@/lib/api"
import MediaSearchResults from "@/components/media-search-results"
import { MediaItem } from "@/types/database"
import { useDebouncedCallback } from 'use-debounce'

const formSchema = z.object({
  date: z.date().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  addToWatchlist: z.boolean().optional(),
})

export default function AddMediaForm() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: "",
      notes: "",
      addToWatchlist: false,
    },
  })

  const performSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      console.log('Performing search for:', query);
      const response = await fetch(`/api/media/search?q=${encodeURIComponent(query)}`);
      console.log('Search response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }
      
      const results = await response.json();
      console.log('Search results:', results);
      
      if (!Array.isArray(results)) {
        throw new Error('Invalid results format received');
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Search Error",
        description: error instanceof Error ? error.message : 'Failed to search media',
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    performSearch(value);
  };

  const handleSelectMedia = (media: MediaItem) => {
    setSelectedMedia(media);
    setSearchResults([]);
    setSearchQuery("");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedMedia) {
      toast({
        title: "Error",
        description: "Please select a media item first",
        variant: "destructive",
      });
      return;
    }

    try {
      const mediaData = {
        ...values,
        mediaId: selectedMedia.id,
      }

      await addMediaToLibrary(mediaData)

      toast({
        title: "Added to library",
        description: `${selectedMedia.title} has been added to your library.`,
      })

      // Reset form
      form.reset()
      setSelectedMedia(null)
      setSearchQuery("")
    } catch (error) {
      console.error("Failed to add media:", error)
      toast({
        title: "Failed to add",
        description: "There was an error adding this to your library.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Log your media</h2>
        <p className="text-sm text-muted-foreground">What did you watch/read?</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for books, movies or TV shows..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-2.5 top-2.5">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="max-w-4xl">
            <MediaSearchResults results={searchResults} onSelect={handleSelectMedia} />
          </div>
        )}

        {selectedMedia && (
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="w-16 h-24 relative overflow-hidden rounded">
              <img
                src={selectedMedia.coverImage || "/placeholder.svg"}
                alt={selectedMedia.title}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h3 className="font-medium">{selectedMedia.title}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedMedia.type} • {selectedMedia.releaseDate ? new Date(selectedMedia.releaseDate).getFullYear() : 'N/A'}
              </p>
              <div className="flex gap-1 mt-1">
                {selectedMedia.genres?.slice(0, 3).map((genre) => (
                  <span key={genre} className="text-xs bg-secondary px-2 py-0.5 rounded">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>When did you watch/read it?</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select when you watched or read this media
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 'thought-provoking', 'funny', 'rewatched'" {...field} />
                </FormControl>
                <FormDescription>
                Add tags, comma separated
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g. 'I feel an underlying nostalgia for yesterday's worlds that have never been'"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                Add your thoughts or notes about this media 
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={!selectedMedia}>
            Add to Library
          </Button>
        </form>
      </Form>
    </div>
  )
}
