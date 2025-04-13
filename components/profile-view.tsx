"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
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
import { MediaItem, MediaEntry, MediaType } from "@/types/database"
import { RatingDistribution } from "@/components/rating-distribution"
import { getUserMediaEntries, getUserWatchlist } from "@/lib/firebase/firestore"
import { format } from "date-fns"
import { Timestamp } from 'firebase/firestore'
import { updateFavoriteMedia } from "@/lib/firebase/firestore"
import { useRouter } from "next/navigation"
import { generateTasteSummary } from "@/lib/gemini/taste-summary"


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
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [profileImage, setProfileImage] = useState(profile.image || "/placeholder.svg?height=128&width=128")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [libraryEntries, setLibraryEntries] = useState<(MediaEntry & { id: string })[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | 'all'>('all');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'watchlist'>('library');
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);

  const [editingMedia, setEditingMedia] = useState<{
    type: keyof FavoriteMediaCollection | null
    isOpen: boolean
  }>({
    type: null,
    isOpen: false
  })

  const [tasteData, setTasteData] = useState<{
    description: string
  } | null>(null)
  
  useEffect(() => {
    const fetchTasteData = async () => {
      try {
        const entries = await getUserMediaEntries(profile.id)
        if (!entries || entries.length === 0) return
  
        const report = await generateTasteSummary(entries)
        setTasteData({ description: report })
      } catch (error) {
        console.error("Failed to load AI taste data:", error)
      }
    }
  
    fetchTasteData()
  }, [profile.id])

  const [favoriteMedia, setFavoriteMedia] = useState<FavoriteMediaCollection>({
    book: profile.favoriteMedia?.book || {
      title: "The Lord of the Rings",
      coverImage: "/placeholder.svg?height=400&width=250",
    },
    movie: profile.favoriteMedia?.movie || {
      title: "The Shawshank Redemption",
      coverImage: "/placeholder.svg?height=400&width=250",
    },
    series: profile.favoriteMedia?.tv || {
      title: "Breaking Bad",
      coverImage: "/placeholder.svg?height=400&width=250",
    },
  });

  // Add useEffect to update favoriteMedia when profile changes
  useEffect(() => {
    console.log('Updating favorite media from profile:', profile.favoriteMedia);
    setFavoriteMedia({
      book: profile.favoriteMedia?.book || {
        title: "The Lord of the Rings",
        coverImage: "/placeholder.svg?height=400&width=250",
      },
      movie: profile.favoriteMedia?.movie || {
        title: "The Shawshank Redemption",
        coverImage: "/placeholder.svg?height=400&width=250",
      },
      series: profile.favoriteMedia?.tv || {
        title: "Breaking Bad",
        coverImage: "/placeholder.svg?height=400&width=250",
      },
    });
  }, [profile.favoriteMedia]);

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
    averageRating: profile.stats?.averageRating || 0,
    numberOfRatings: profile.stats?.totalRatings || 0,
    mostFrequent: profile.stats?.ratingDistribution ? 
      Object.entries(profile.stats.ratingDistribution as Record<string, number>)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 0 : 0,
    distribution: profile.stats?.ratingDistribution as Record<string, number> || {}
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
    console.log('Starting search with query:', query, 'and type:', editingMedia.type);
    setSearchQuery(query)
    if (query.length > 2) {
      setIsSearching(true)
      try {
        // Convert media type to API expected format
        const mediaType = editingMedia.type === 'series' ? 'tv' : editingMedia.type;
        console.log('Searching for media type:', mediaType);
        const response = await fetch(`/api/media/search?q=${encodeURIComponent(query)}&type=${mediaType}`);
        if (!response.ok) {
          throw new Error('Search failed');
        }
        const results = await response.json();
        console.log('Search results:', results);
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

  const handleSelectMedia = async (media: MediaItem) => {
    console.log('Selected media:', media);
    if (editingMedia.type) {
      const mediaType = editingMedia.type as keyof FavoriteMediaCollection;
      console.log('Updating favorite media for type:', mediaType);
      try {
        // Convert 'series' to 'tv' for Firestore
        const firestoreMediaType = mediaType === 'series' ? 'tv' : mediaType;
        
        // Update the database
        console.log('Updating database with:', {
          userId: profile.id,
          mediaType: firestoreMediaType as MediaType,
          mediaData: {
            mediaId: media.id,
            title: media.title,
            coverImage: media.coverImage || "/placeholder.svg",
          }
        });
        await updateFavoriteMedia(profile.id, firestoreMediaType as MediaType, {
          mediaId: media.id,
          title: media.title,
          coverImage: media.coverImage || "/placeholder.svg",
        });

        // Update local state
        console.log('Updating local state with:', {
          [mediaType]: {
            title: media.title,
            coverImage: media.coverImage || "/placeholder.svg",
          }
        });
        setFavoriteMedia(prev => ({
          ...prev,
          [mediaType]: {
            title: media.title,
            coverImage: media.coverImage || "/placeholder.svg",
          }
        }));

        // Close dialog and reset search
        setEditingMedia({ type: null, isOpen: false });
        setSearchQuery("");
        setSearchResults([]);

        // Show success toast
        toast({
          title: "Success",
          description: `Updated favorite ${mediaType}`,
        });
      } catch (error) {
        console.error('Error updating favorite media:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
        toast({
          title: "Error",
          description: "Failed to update favorite media",
          variant: "destructive",
        });
      }
    }
  };

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

  const formatDate = (date: Date | Timestamp) => {
    const jsDate = date instanceof Date ? date : date.toDate();
    return jsDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchLibrary = async () => {
      if (!profile.id) return;
      setIsLoadingLibrary(true);
      try {
        const entries = await getUserMediaEntries(profile.id);
        setLibraryEntries(entries);
      } catch (error) {
        console.error('Error fetching library:', error);
        toast({
          title: "Error",
          description: "Failed to load library",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLibrary(false);
      }
    };

    const fetchWatchlist = async () => {
      if (!profile.id) return;
      setIsLoadingWatchlist(true);
      try {
        const watchlistIds = await getUserWatchlist(profile.id);
        console.log('Watchlist IDs:', watchlistIds);
        
        const watchlistItems = await Promise.all(
          watchlistIds.map(async (id) => {
            try {
              // Ensure the ID is in the correct format (type-id)
              const formattedId = id.includes('-') ? id : `movie-${id}`;
              console.log('Fetching media with ID:', formattedId);
              
              const response = await fetch(`/api/media/${formattedId}`);
              if (!response.ok) {
                console.error('Failed to fetch media:', response.status, response.statusText);
                throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
              }
              return response.json();
            } catch (error) {
              console.error('Error fetching media item:', id, error);
              return null; // Return null for failed items instead of throwing
            }
          })
        );
        
        // Filter out any null items from failed fetches
        const validItems = watchlistItems.filter(item => item !== null);
        setWatchlist(validItems);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        toast({
          title: "Error",
          description: "Failed to load watchlist",
          variant: "destructive",
        });
      } finally {
        setIsLoadingWatchlist(false);
      }
    };

    fetchLibrary();
    fetchWatchlist();
  }, [profile.id]);

  // Add function to get media entries for a specific date
  const getMediaEntriesForDate = (date: Date) => {
    if (isLoadingLibrary) {
      return []
    }
    
    if (!libraryEntries.length) {
      console.log('No library entries available');
      return [];
    }
    
    const entries = libraryEntries.filter(entry => {
      if (!entry.watchedAt) {
        console.log('Entry missing watchedAt:', entry);
        return false;
      }
      
      const entryDate = entry.watchedAt instanceof Date ? entry.watchedAt : entry.watchedAt.toDate();
      const isMatch = entryDate.toDateString() === date.toDateString();
      const matchesType = selectedMediaType === 'all' || entry.type === selectedMediaType;
      
      if (isMatch) {
        console.log('Found matching entry for date:', date.toDateString(), entry);
      }
      
      return isMatch && matchesType;
    });
    
    // Sort entries by rating in descending order
    return entries.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  };

  // Update the calendar cell rendering
  const renderCalendarCell = (date: Date) => {
    const entries = getMediaEntriesForDate(date);
    const hasEntries = entries.length > 0;
    
    return (
      <div 
        key={date.toISOString()} 
        className="aspect-square p-1 relative group"
        onMouseEnter={() => setHoveredDate(date)}
        onMouseLeave={() => setHoveredDate(null)}
      >
        <div className="relative w-full h-full">
          {hasEntries && (
            <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
              {entries.slice(0, 2).map((entry, index) => (
                <div key={`${entry.id}-${index}`} className="relative aspect-[2/3] rounded overflow-hidden">
                  <img
                    src={entry.coverImage || "/placeholder.svg"}
                    alt={entry.title}
                    className="object-cover w-full h-full"
                  />
                  {entry.rating > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-1 text-xs text-center">
                      ★ {entry.rating}
                    </div>
                  )}
                </div>
              ))}
              {entries.length > 2 && (
                <div className="absolute bottom-0 right-0 bg-background/80 px-1 rounded text-xs">
                  +{entries.length - 2}
                </div>
              )}
            </div>
          )}
          <div className={`absolute top-1 left-1 text-xs ${hasEntries ? 'text-background' : ''}`}>
            {date.getDate()}
          </div>
        </div>

        {/* Tooltip for showing all entries */}
        {hoveredDate?.toDateString() === date.toDateString() && entries.length > 0 && (
          <div className="absolute z-50 w-64 p-2 bg-background border rounded-lg shadow-lg">
            <div className="text-sm font-medium mb-1">
              {format(date, 'MMMM d, yyyy')}
            </div>
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <div className="w-8 h-12 relative flex-shrink-0">
                    <img
                      src={entry.coverImage || "/placeholder.svg"}
                      alt={entry.title}
                      className="object-cover w-full h-full rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{entry.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.type} • {entry.rating ? `★ ${entry.rating}` : 'No rating'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
              </div>
              <CardTitle className="mt-4">{profile.name}</CardTitle>
              <CardDescription>@{profile.username}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Favorite Media</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['book', 'movie', 'tv'] as const).map((type) => (
                      <div key={type} className="text-center">
                        <div 
                          className={`relative w-full aspect-[2/3] rounded-md overflow-hidden mb-1 ${isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity group' : ''} ${!profile.favoriteMedia?.[type] ? 'bg-muted' : ''}`}
                          onClick={() => isOwnProfile && handleEditMedia(type === 'tv' ? 'series' : type)}
                        >
                          {profile.favoriteMedia?.[type] && (
                            <>
                              <Image
                                src={profile.favoriteMedia[type].coverImage}
                                alt={profile.favoriteMedia[type].title}
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
                            </>
                          )}
                          {isOwnProfile && !profile.favoriteMedia?.[type] && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-6 w-6 text-muted-foreground"
                              >
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <Badge variant="outline" className="text-xs">
                            {type === 'movie' && <Film className="h-3 w-3 mr-1" />}
                            {type === 'book' && <BookOpen className="h-3 w-3 mr-1" />}
                            {type === 'tv' && <Tv className="h-3 w-3 mr-1" />}
                            <span>{type === 'tv' ? 'Series' : type.charAt(0).toUpperCase() + type.slice(1)}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Rating Distribution</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{ratingData.averageRating.toFixed(1)}</div>
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
                <Link href={`/profile/${profile.id}/ai-report`}>
                  <Button variant="default" className="bg-pink-500 hover:bg-pink-600 text-white">
                    See full AI report
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{tasteData?.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle>Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Select 
                  value={selectedMediaType} 
                  onValueChange={(value) => setSelectedMediaType(value as MediaType | 'all')}
                >
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="tv">TV Shows</SelectItem>
                    <SelectItem value="book">Books</SelectItem>
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
                  
                  return isCurrentMonth ? renderCalendarCell(currentDate) : (
                    <div key={i} className="aspect-square p-1">
                      <div className="relative w-full h-full">
                        <div className="absolute top-1 left-1 text-xs text-muted-foreground">
                          {day}
                        </div>
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
                </div>
                <CardDescription>Your personal media collection</CardDescription>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="library">
                <TabsList>
                  <TabsTrigger value="library" onClick={() => setActiveTab('library')}>
                    Library
                  </TabsTrigger>
                  <TabsTrigger value="watchlist" onClick={() => setActiveTab('watchlist')}>
                    Watchlist
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="library" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Select
                      value={selectedMediaType}
                      onValueChange={(value) => setSelectedMediaType(value as MediaType | 'all')}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="movie">Movies</SelectItem>
                        <SelectItem value="tv">TV Shows</SelectItem>
                        <SelectItem value="book">Books</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="h-[400px]">
                    {activeTab === 'library' ? (
                      isLoadingLibrary ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {libraryEntries
                            .filter(entry => selectedMediaType === 'all' || entry.type === selectedMediaType)
                            .map((item) => (
                              <div 
                                key={item.id} 
                                className="flex gap-3 p-2 border rounded-lg hover:bg-accent cursor-pointer"
                                onClick={() => router.push(`/media/${item.mediaId}`)}
                              >
                                <div className="relative w-16 h-24">
                                  <Image
                                    src={item.coverImage || "/placeholder.svg"}
                                    alt={item.title}
                                    fill
                                    className="object-cover rounded"
                                  />
                                </div>
                                <div className="flex flex-col justify-between">
                                  <div>
                                    <h3 className="font-medium line-clamp-1">{item.title}</h3>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {item.type === "movie" && <Film className="h-3 w-3" />}
                                      {item.type === "book" && <BookOpen className="h-3 w-3" />}
                                      {item.type === "tv" && <Tv className="h-3 w-3" />}
                                      <span className="capitalize">{item.type}</span>
                                      {item.rating > 0 && (
                                        <>
                                          <span>•</span>
                                          <span>★ {item.rating}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                    Added: {formatDate(item.watchedAt)}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )
                    ) : (
                      isLoadingWatchlist ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {watchlist
                            .filter(item => selectedMediaType === 'all' || item.type === selectedMediaType)
                            .map((item) => (
                              <div 
                                key={`${item.type}-${item.id}`} 
                                className="flex gap-3 p-2 border rounded-lg hover:bg-accent cursor-pointer"
                                onClick={() => router.push(`/media/${item.id}`)}
                              >
                                <div className="relative w-16 h-24">
                                  <Image
                                    src={item.coverImage || "/placeholder.svg"}
                                    alt={item.title}
                                    fill
                                    className="object-cover rounded"
                                  />
                                </div>
                                <div className="flex flex-col justify-between">
                                  <div>
                                    <h3 className="font-medium line-clamp-1">{item.title}</h3>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {item.type === "movie" && <Film className="h-3 w-3" />}
                                      {item.type === "book" && <BookOpen className="h-3 w-3" />}
                                      {item.type === "tv" && <Tv className="h-3 w-3" />}
                                      <span className="capitalize">{item.type}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="watchlist" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Select
                      value={selectedMediaType}
                      onValueChange={(value) => setSelectedMediaType(value as MediaType | 'all')}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="movie">Movies</SelectItem>
                        <SelectItem value="tv">TV Shows</SelectItem>
                        <SelectItem value="book">Books</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="h-[400px]">
                    {isLoadingWatchlist ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {watchlist
                          .filter(item => selectedMediaType === 'all' || item.type === selectedMediaType)
                          .map((item) => (
                            <div 
                              key={`${item.type}-${item.id}`} 
                              className="flex gap-3 p-2 border rounded-lg hover:bg-accent cursor-pointer"
                              onClick={() => router.push(`/media/${item.id}`)}
                            >
                              <div className="relative w-16 h-24">
                                <Image
                                  src={item.coverImage || "/placeholder.svg"}
                                  alt={item.title}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                              <div className="flex flex-col justify-between">
                                <div>
                                  <h3 className="font-medium line-clamp-1">{item.title}</h3>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {item.type === "movie" && <Film className="h-3 w-3" />}
                                    {item.type === "book" && <BookOpen className="h-3 w-3" />}
                                    {item.type === "tv" && <Tv className="h-3 w-3" />}
                                    <span className="capitalize">{item.type}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
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