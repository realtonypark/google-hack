"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Search, X, BookOpen, Film, Tv } from "lucide-react"
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
import { MediaItem, MediaType } from "@/types/database"
import { useDebouncedCallback } from 'use-debounce'
import { Rating } from "@/components/ui/rating"
import { useSearchParams, useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/firebase"

const formSchema = z.object({
  date: z.date().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  rating: z.number().min(0.5).max(5).optional(),
  addToWatchlist: z.boolean().optional(),
})

export default function AddMediaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [selectedType, setSelectedType] = useState<MediaType>('movie')

  // Fetch pre-selected media if mediaId is provided in URL
  useEffect(() => {
    const mediaId = searchParams.get('mediaId')
    if (mediaId) {
      const fetchMedia = async () => {
        setIsLoadingMedia(true)
        try {
          const response = await fetch(`/api/media/${mediaId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch media')
          }
          const data = await response.json()
          setSelectedMedia(data)
        } catch {
          toast({
            title: "Error",
            description: "Failed to load media details",
            variant: "destructive",
          })
        } finally {
          setIsLoadingMedia(false)
        }
      }
      fetchMedia()
    }
  }, [searchParams, toast])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: "",
      notes: "",
      rating: 0,
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
      const response = await fetch(`/api/media/search?q=${encodeURIComponent(query)}${selectedType ? `&type=${selectedType}` : ''}`);
      
      if (!response.ok) {
        setSearchResults([]);
        return;
      }
      
      const results = await response.json();
      
      if (!Array.isArray(results)) {
        setSearchResults([]);
        return;
      }
      
      setSearchResults(results);
    } catch {
      setSearchResults([]);
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
        description: "Please select a media to add",
        variant: "destructive",
      })
      return
    }

    try {
      await addMediaToLibrary({
        mediaId: selectedMedia.id,
        date: values.date,
        tags: values.tags,
        notes: values.notes,
        rating: values.rating,
        title: selectedMedia.title,
        coverImage: selectedMedia.coverImage,
      })

      toast({
        title: "Success",
        description: "Media added to your library",
      })

      // Navigate to the profile page after successful addition
      const user = auth.currentUser
      if (user) {
        router.push(`/profile/${user.uid}`)
      }
    } catch (error) {
      console.error('Error adding media:', error)
      toast({
        title: "Error",
        description: "Failed to add media to library",
        variant: "destructive",
      })
    }
  }

  const getSearchPlaceholder = () => {
    switch (selectedType) {
      case 'movie':
        return "Search movies...";
      case 'tv':
        return "Search TV shows...";
      case 'book':
        return "Search books...";
      default:
        return "Search movies...";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Log your media</h2>
        <p className="text-sm text-muted-foreground">What did you watch/read?</p>
      </div>

      {!selectedMedia && !isLoadingMedia && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">Search by category:</p>
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'movie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('movie')}
              >
                <Film className="mr-2 h-4 w-4" />
                Movies
              </Button>
              <Button
                variant={selectedType === 'tv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('tv')}
              >
                <Tv className="mr-2 h-4 w-4" />
                TV Shows
              </Button>
              <Button
                variant={selectedType === 'book' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('book')}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Books
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={getSearchPlaceholder()}
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
        </div>
      )}

      {isLoadingMedia && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
          <div className="flex-1">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedMedia(null)
              setSearchQuery("")
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear selection</span>
          </Button>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <Rating
                    value={field.value || 0}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Rate this media from 0.5 to 5 stars
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                Add tags to help us better recommend you contents, comma separated
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
                Add your thoughts or notes about this media to help us better recommend you contents
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
