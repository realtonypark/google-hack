"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { CalendarIcon, BookOpen, Film, Tv, ListChecks, ChevronLeft, ChevronRight, ChevronDown, Search, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { MediaItem } from "@/types/database"
import { RatingDistribution } from "@/components/rating-distribution"

interface ProfileViewProps {
  profile: any
  isOwnProfile: boolean
}

interface FavoriteMedia {
  title: string
  coverImage: string
}

interface FavoriteMediaCollection {
  book: { title: string; coverImage: string }
  movie: { title: string; coverImage: string }
  series: { title: string; coverImage: string }
}

export default function ProfileView({ profile, isOwnProfile }: ProfileViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [profileImage, setProfileImage] = useState(profile.image || "/placeholder.svg?height=128&width=128")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock taste data
  const tasteData = {
    description:
      "You're a cinematic explorer with a penchant for thought-provoking narratives. Your media choices reveal a mind that enjoys complex characters and intricate plots. While you appreciate the occasional blockbuster, you're drawn to stories that challenge conventions and offer fresh perspectives.",
    genres: [
      { name: "Drama", percentage: 35 },
      { name: "Sci-Fi", percentage: 25 },
      { name: "Thriller", percentage: 20 },
      { name: "Fantasy", percentage: 15 },
      { name: "Comedy", percentage: 5 },
    ],
    favoriteMedia: {
      book: {
        title: "The Lord of the Rings",
        coverImage: "/placeholder.svg?height=400&width=250",
      },
      movie: {
        title: "The Shawshank Redemption",
        coverImage: "/placeholder.svg?height=400&width=250",
      },
      series: {
        title: "Breaking Bad",
        coverImage: "/placeholder.svg?height=400&width=250",
      },
    },
  }

  const [editingMedia, setEditingMedia] = useState<{
    type: keyof FavoriteMediaCollection | null
    isOpen: boolean
  }>({
    type: null,
    isOpen: false
  })

  const [favoriteMedia, setFavoriteMedia] = useState<FavoriteMediaCollection>(tasteData.favoriteMedia)

  const formatYearMonth = (date: Date) => {
    return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prevDate => {
      const newDate = new Date(prevDate)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // Mock data for demo
  const mockLibrary = [
    {
      id: "1",
      title: "The Shawshank Redemption",
      type: "movie",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "1994",
      genres: ["Drama"],
      dateAdded: "2023-10-15",
    },
    {
      id: "2",
      title: "The Lord of the Rings",
      type: "book",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "1954",
      genres: ["Fantasy", "Adventure"],
      dateAdded: "2023-11-20",
    },
    {
      id: "3",
      title: "Breaking Bad",
      type: "series",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "2008",
      genres: ["Crime", "Drama", "Thriller"],
      dateAdded: "2023-12-05",
    },
  ]

  const mockWatchlist = [
    {
      id: "4",
      title: "Inception",
      type: "movie",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "2010",
      genres: ["Sci-Fi", "Action"],
    },
    {
      id: "5",
      title: "1984",
      type: "book",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "1949",
      genres: ["Dystopian", "Sci-Fi"],
    },
  ]

  // Mock rating distribution data
  const ratingData = {
    averageRating: 3.7,
    numberOfRatings: 295,
    mostFrequent: 4.0,
    distribution: {
      "0.5": 5,
      "1.0": 10,
      "1.5": 12,
      "2.0": 15,
      "2.5": 20,
      "3.0": 35,
      "3.5": 45,
      "4.0": 80,
      "4.5": 50,
      "5.0": 23
    }
  }

  const handleEditMedia = (type: keyof FavoriteMediaCollection) => {
    if (isOwnProfile) {
      setEditingMedia({ type, isOpen: true })
    }
  }

  const handleSaveMedia = (newTitle: string, newCoverImage: string) => {
    if (editingMedia.type) {
      const mediaType = editingMedia.type
      setFavoriteMedia(prev => ({
        ...prev,
        [mediaType]: {
          title: newTitle,
          coverImage: newCoverImage,
        }
      }))
      setEditingMedia({ type: null, isOpen: false })
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      setIsSearching(true)
      try {
        // Convert media type to API expected format
        const mediaType = editingMedia.type === 'series' ? 'tv' : editingMedia.type;
        const response = await fetch(`/api/media/search?q=${encodeURIComponent(query)}&type=${mediaType}`);
        if (!response.ok) {
          throw new Error('Search failed');
        }
        const results = await response.json();
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        toast({
          title: "Search Error",
          description: "Failed to search for media",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  }

  const handleSelectMedia = (media: MediaItem) => {
    if (editingMedia.type) {
      const mediaType = editingMedia.type as keyof FavoriteMediaCollection;
      setFavoriteMedia(prev => ({
        ...prev,
        [mediaType]: {
          title: media.title,
          coverImage: media.coverImage || "/placeholder.svg",
        }
      }));
      setEditingMedia({ type: null, isOpen: false });
      setSearchQuery("");
      setSearchResults([]);
    }
  }

  const handleProfileImageClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      // Create a URL for the selected file
      const imageUrl = URL.createObjectURL(file)
      setProfileImage(imageUrl)

      // TODO: Upload the image to your backend here
      // You would typically:
      // 1. Create a FormData object
      // 2. Append the file to it
      // 3. Send it to your API endpoint
      // 4. Update the profile image URL with the response from the server
    }
  }

  return (
    <div className="container py-10">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
              <div className="relative w-32 h-32">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profileImage} />
                  <AvatarFallback>{profile.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="absolute bottom-0 right-0 rounded-full"
                      onClick={handleProfileImageClick}
                    >
                      <span className="sr-only">Edit Avatar</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                    />
                  </>
                )}
              </div>
              <CardTitle className="mt-4">{profile.name}</CardTitle>
              <CardDescription>@{profile.username}</CardDescription>

              <div className="flex gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.following || 0}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.followers || 0}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
              </div>

              {!isOwnProfile && <Button className="mt-4 w-full">Follow</Button>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Favorite Media (Show your identity!)</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div 
                        className={`relative w-full aspect-[2/3] rounded-md overflow-hidden mb-1 ${isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity group' : ''}`}
                        onClick={() => handleEditMedia('book')}
                      >
                        <Image
                          src={favoriteMedia.book.coverImage || "/placeholder.svg"}
                          alt={favoriteMedia.book.title}
                          fill
                          className="object-cover"
                        />
                        {isOwnProfile && (
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="absolute bottom-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          <BookOpen className="h-3 w-3 mr-1" />
                          Book
                        </Badge>
                      </div>
                    </div>
                    <div className="text-center">
                      <div 
                        className={`relative w-full aspect-[2/3] rounded-md overflow-hidden mb-1 ${isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity group' : ''}`}
                        onClick={() => handleEditMedia('movie')}
                      >
                        <Image
                          src={favoriteMedia.movie.coverImage || "/placeholder.svg"}
                          alt={favoriteMedia.movie.title}
                          fill
                          className="object-cover"
                        />
                        {isOwnProfile && (
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="absolute bottom-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          <Film className="h-3 w-3 mr-1" />
                          Movie
                        </Badge>
                      </div>
                    </div>
                    <div className="text-center">
                      <div 
                        className={`relative w-full aspect-[2/3] rounded-md overflow-hidden mb-1 ${isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity group' : ''}`}
                        onClick={() => handleEditMedia('series')}
                      >
                        <Image
                          src={favoriteMedia.series.coverImage || "/placeholder.svg"}
                          alt={favoriteMedia.series.title}
                          fill
                          className="object-cover"
                        />
                        {isOwnProfile && (
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="absolute bottom-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          <Tv className="h-3 w-3 mr-1" />
                          Series
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Rating Distribution</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{ratingData.averageRating}</div>
                        <div className="text-xs text-muted-foreground">Average Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{ratingData.numberOfRatings}</div>
                        <div className="text-xs text-muted-foreground">Number of Ratings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{ratingData.mostFrequent}</div>
                        <div className="text-xs text-muted-foreground">Most frequent</div>
                      </div>
                    </div>
                    <div className="px-2">
                      <div className="w-full max-w-lg">
                        <RatingDistribution 
                          distribution={ratingData.distribution}
                          totalRatings={Object.values(ratingData.distribution).reduce((a, b) => a + b, 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Taste Report</CardTitle>
                  <CardDescription>AI-generated analysis of your media preferences</CardDescription>
                </div>
                <Button variant="ghost" className="text-primary hover:text-primary">
                  See full analysis
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{tasteData.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle>Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue>All</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="movies">Movies</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="series">Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button 
                    className="p-2 hover:bg-accent rounded-md"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <span className="text-xl font-semibold">{formatYearMonth(currentMonth)}</span>
                  <button 
                    className="p-2 hover:bg-accent rounded-md"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToToday}
                >
                  Today
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-6 text-center mb-4">
                <div className="text-sm text-muted-foreground">Sun</div>
                <div className="text-sm text-muted-foreground">Mon</div>
                <div className="text-sm text-muted-foreground">Tue</div>
                <div className="text-sm text-muted-foreground">Wed</div>
                <div className="text-sm text-muted-foreground">Thu</div>
                <div className="text-sm text-muted-foreground">Fri</div>
                <div className="text-sm text-muted-foreground">Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-sm">
                {Array.from({ length: 35 }, (_, i) => {
                  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
                  const startingDayOfWeek = firstDayOfMonth.getDay()
                  const day = i - startingDayOfWeek + 1
                  const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                  
                  // Check if the day is within the current month
                  const isCurrentMonth = currentDate.getMonth() === currentMonth.getMonth()
                  
                  // Check if this day has content (for demo purposes)
                  const hasContent = [8, 9, 14].includes(day) && isCurrentMonth

                  return (
                    <div key={i} className="aspect-square p-1">
                      <div className="relative w-full h-full">
                        {isCurrentMonth && (
                          <>
                            <div className="absolute top-1 left-1">{day}</div>
                            {hasContent && (
                              <div className="absolute inset-4 grid grid-cols-2 gap-0.5">
                                <div className="relative aspect-[2/3] rounded overflow-hidden">
                                  <Image
                                    src="/placeholder.svg"
                                    alt="Media thumbnail"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="relative aspect-[2/3] rounded overflow-hidden">
                                  <Image
                                    src="/placeholder.svg"
                                    alt="Media thumbnail"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Tabs defaultValue="library">
                <div className="flex items-center justify-between">
                  <CardTitle>Media Collection</CardTitle>
                  <TabsList>
                    <TabsTrigger value="library">Library</TabsTrigger>
                    <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>Your personal media collection</CardDescription>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="library">
                <TabsContent value="library" className="mt-0">
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                      {mockLibrary.map((item) => (
                        <div key={item.id} className="flex gap-3 p-2 border rounded-lg">
                          <div className="w-16 h-24 relative overflow-hidden rounded">
                            <img
                              src={item.coverImage || "/placeholder.svg"}
                              alt={item.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex flex-col justify-between">
                            <div>
                              <h3 className="font-medium line-clamp-1">{item.title}</h3>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {item.type === "movie" && <Film className="h-3 w-3" />}
                                {item.type === "book" && <BookOpen className="h-3 w-3" />}
                                {item.type === "series" && <Tv className="h-3 w-3" />}
                                <span className="capitalize">{item.type}</span>
                                <span>•</span>
                                <span>{item.year}</span>
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              Added: {new Date(item.dateAdded).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="watchlist" className="mt-0">
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                      {mockWatchlist.map((item) => (
                        <div key={item.id} className="flex gap-3 p-2 border rounded-lg">
                          <div className="w-16 h-24 relative overflow-hidden rounded">
                            <img
                              src={item.coverImage || "/placeholder.svg"}
                              alt={item.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium line-clamp-1">{item.title}</h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {item.type === "movie" && <Film className="h-3 w-3" />}
                              {item.type === "book" && <BookOpen className="h-3 w-3" />}
                              {item.type === "series" && <Tv className="h-3 w-3" />}
                              <span className="capitalize">{item.type}</span>
                              <span>•</span>
                              <span>{item.year}</span>
                            </div>
                            <div className="mt-2">
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <ListChecks className="h-3 w-3 mr-1" />
                                Mark as Watched
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Media Dialog */}
      <Dialog open={editingMedia.isOpen} onOpenChange={(open) => {
        setEditingMedia({ type: null, isOpen: open });
        setSearchQuery("");
        setSearchResults([]);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Favorite {editingMedia.type?.charAt(0).toUpperCase()}{editingMedia.type?.slice(1)}</DialogTitle>
            <DialogDescription>
              Search and select your favorite {editingMedia.type} from our database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={`Search for a ${editingMedia.type}...`}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-2.5 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>

            <div className="relative min-h-[200px]">
              {isSearching ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-accent"
                        onClick={() => handleSelectMedia(result)}
                      >
                        <div className="w-12 h-16 relative rounded overflow-hidden">
                          <Image
                            src={result.coverImage || "/placeholder.svg"}
                            alt={result.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{result.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {result.type} • {result.releaseDate ? new Date(result.releaseDate).getFullYear() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : searchQuery.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  {searchQuery.length <= 2 ? 
                    "Type at least 3 characters to search" : 
                    "No results found"}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}