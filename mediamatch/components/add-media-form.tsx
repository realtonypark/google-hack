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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { searchMedia, addMediaToLibrary } from "@/lib/api"
import MediaSearchResults from "@/components/media-search-results"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["book", "movie", "series"], {
    required_error: "Please select a media type",
  }),
  date: z.date().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  addToWatchlist: z.boolean().optional(),
})

export default function AddMediaForm() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedMedia, setSelectedMedia] = useState<any>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "movie",
      tags: "",
      notes: "",
      addToWatchlist: false,
    },
  })

  const handleSearch = async () => {
    if (!searchQuery) return

    setIsSearching(true)
    try {
      const results = await searchMedia(searchQuery, form.getValues("type"))
      setSearchResults(results)
    } catch (error) {
      console.error("Search failed:", error)
      toast({
        title: "Search failed",
        description: "Failed to search for media. Please try again.",
        variant: "destructive",
      })
      // Mock data for demo
      setSearchResults([
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
          title: "The Shining",
          type: "movie",
          coverImage: "/placeholder.svg?height=400&width=250",
          year: "1980",
          genres: ["Horror"],
        },
      ])
    } finally {
      setIsSearching(false)
    }
  }

  const selectMedia = (media: any) => {
    setSelectedMedia(media)
    form.setValue("title", media.title)
    setSearchResults([])
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const mediaData = {
        ...values,
        ...(selectedMedia ? { mediaId: selectedMedia.id } : {}),
      }

      await addMediaToLibrary(mediaData)

      toast({
        title: "Added to library",
        description: `${values.title} has been added to your library.`,
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
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Search for Media</h2>
          <p className="text-sm text-muted-foreground">Find books, movies, or TV shows to add to your library</p>
        </div>

        <div className="flex gap-2">
          <Select value={form.getValues("type")} onValueChange={(value) => form.setValue("type", value as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Media Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="book">Book</SelectItem>
              <SelectItem value="movie">Movie</SelectItem>
              <SelectItem value="series">TV Series</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Input
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-0 top-0 h-full px-3"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </div>

        {searchResults.length > 0 && <MediaSearchResults results={searchResults} onSelect={selectMedia} />}

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
                {selectedMedia.type} • {selectedMedia.year}
              </p>
              <div className="flex gap-1 mt-1">
                {selectedMedia.genres.map((genre: string) => (
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
          <div>
            <h2 className="text-xl font-semibold">Add Details</h2>
            <p className="text-sm text-muted-foreground">Customize information about this media</p>
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date Watched/Read</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>When did you watch or read this?</FormDescription>
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
                  <Input {...field} placeholder="action, favorite, rewatched" />
                </FormControl>
                <FormDescription>Separate tags with commas</FormDescription>
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
                  <Textarea placeholder="Your thoughts about this media..." className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Add to Library</Button>
        </form>
      </Form>
    </div>
  )
}
