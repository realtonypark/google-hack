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
import ChatbotLauncher from "@/components/ChatbotLauncher"
import { useDebouncedCallback } from 'use-debounce'

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
  tv: { title: string; coverImage: string }
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
  const [favoriteMedia, setFavoriteMedia] = useState<FavoriteMediaCollection>(
    profile.favoriteMedia || {
      book: { title: "", coverImage: "" },
      movie: { title: "", coverImage: "" },
      series: { title: "", coverImage: "" },
    }
  );
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


  const handleSearch = async (query: string) => {
    console.log('Starting search with query:', query, 'and type:', editingMedia.type);
    setSearchQuery(query)
    if (query.length > 2) {
      setIsSearching(true)
      try {
        // Convert media type to API expected format
        const mediaType = editingMedia.type;
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
        const firestoreMediaType = mediaType;
        
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
      setFavoriteMedia((prev) => ({
        ...prev,
        [mediaType]: {
          title: media.title,
          coverImage: media.coverImage || "/placeholder.svg",
        },
      }));
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

  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const handleGenerateAvatar = async () => {
    try {
      setIsGeneratingAvatar(true);
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          evolutionStage: Math.min(4, Math.floor(libraryEntries.length / 10)), // 0~4단계
        }),
      });
  
      if (!res.ok) throw new Error("Generation failed");
  
      const data = await res.json();
      if (data.imageUrl) {
        setProfileImage(data.imageUrl);
        toast({ title: "Avatar updated!" });
      } else {
        throw new Error("No image returned");
      }
    } catch (err) {
      console.error("Avatar generation error:", err);
      toast({ title: "Error", description: "Failed to generate avatar", variant: "destructive" });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await fetch(`/api/avatar/${profile.id}`);
        const data = await res.json();
        if (data.image) {
          setProfileImage(data.image); // 이제 image는 Storage URL이니까 그대로 사용
        }
      } catch (err) {
        console.error("Error loading avatar:", err);
      }
    };
  
    fetchAvatar();
  }, [profile.id]);


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
                <div key={`${entry.id}-${index}`} className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-sm">
                  <img
                    src={entry.coverImage || "/placeholder.svg"}
                    alt={entry.title}
                    className="object-cover w-full h-full"
                  />
                  {entry.rating > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-1 text-xs text-center font-medium">
                      ★ {entry.rating}
                    </div>
                  )}
                </div>
              ))}
              {entries.length > 2 && (
                <div className="absolute bottom-0 right-0 bg-background/80 backdrop-blur-sm px-1 rounded-tl-lg text-xs font-medium">
                  +{entries.length - 2}
                </div>
              )}
            </div>
          )}
          <div className={`absolute top-1 left-1 text-xs ${hasEntries ? 'text-background font-medium' : ''}`}>
            {date.getDate()}
          </div>
        </div>

        {/* Tooltip for showing all entries */}
        {hoveredDate?.toDateString() === date.toDateString() && entries.length > 0 && (
          <div className="absolute z-50 w-64 p-3 bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl">
            <div className="text-sm font-medium mb-2 border-b pb-1">
              {format(date, 'MMMM d, yyyy')}
            </div>
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <div className="w-8 h-12 relative flex-shrink-0">
                    <img
                      src={entry.coverImage || "/placeholder.svg"}
                      alt={entry.title}
                      className="object-cover w-full h-full rounded-lg shadow-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{entry.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {entry.type === "movie" && <Film className="h-3 w-3" />}
                      {entry.type === "book" && <BookOpen className="h-3 w-3" />}
                      {entry.type === "tv" && <Tv className="h-3 w-3" />}
                      <span className="capitalize">{entry.type}</span>
                      {entry.rating ? <span>• ★ {entry.rating}</span> : ''}
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

  const debouncedSearch = useDebouncedCallback((query: string) => {
    handleSearch(query)
  }, 300)

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      {/* Enhanced header with gradient background */}
      <div className="relative mb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -z-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full -z-10 blur-2xl"></div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="border-0 rounded-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)]">
            <CardHeader className="flex flex-col items-center text-center">
              <div className="relative w-32 h-32">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                  <AvatarImage src={profileImage} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-semibold">
                    {profile.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button
                    onClick={handleGenerateAvatar}
                    disabled={isGeneratingAvatar}
                    className="mt-3 w-full"
                  >
                    {isGeneratingAvatar ? "Generating..." : "Generate Avatar"}
                  </Button>
                )}
                {isOwnProfile && (
                  <div 
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
                    onClick={handleProfileImageClick}
                  >
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
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                    />
                  </div>
                )}
              </div>
              <CardTitle className="mt-4 text-2xl font-bold">{profile.name}</CardTitle>
              <CardDescription className="text-base">@{profile.username}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-3 border-b pb-1">Favorite Media</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(['book', 'movie', 'tv'] as const).map((type) => (
                      <div key={type} className="text-center">
                        <div 
                          className={`relative w-full aspect-[2/3] rounded-xl overflow-hidden mb-2 shadow-md 
                                      ${isOwnProfile ? 'cursor-pointer hover:opacity-90 transition-all duration-300 group' : ''} 
                                      ${!profile.favoriteMedia?.[type] ? 'bg-muted' : ''}`}
                          onClick={() => isOwnProfile && handleEditMedia(type)}
                        >
                          {favoriteMedia?.[type] && (
                            <>
                              <Image
                                src={favoriteMedia[type].coverImage}
                                alt={favoriteMedia[type].title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              {/* Cinematic overlay on hover */}
                              {isOwnProfile && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                                               opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              )}
                              {isOwnProfile && (
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 
                                           transition-opacity bg-background/80 backdrop-blur-sm border-white/20"
                                >
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
                              )}
                            </>
                          )}
                          {isOwnProfile && !profile.favoriteMedia?.[type] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-8 w-8 text-muted-foreground"
                              >
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-1 rounded-full
                                      ${type === 'movie' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50' : 
                                      type === 'book' ? 'bg-pink-50 text-pink-700 border-pink-200/50 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800/50' : 
                                      'bg-purple-50 text-purple-700 border-purple-200/50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50'}`}
                          >
                            {type === 'movie' && <Film className="h-3 w-3 mr-1" />}
                            {type === 'book' && <BookOpen className="h-3 w-3 mr-1" />}
                            {type === 'tv' && <Tv className="h-3 w-3 mr-1" />}
                            <span className="font-medium">{type === 'tv' ? 'Series' : type.charAt(0).toUpperCase() + type.slice(1)}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium mb-3 border-b pb-1">Rating Distribution</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="text-2xl font-bold text-primary">{ratingData.averageRating.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground mt-1">Average</div>
                      </div>
                      <div className="text-center p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                        <div className="text-2xl font-bold text-purple-500">{ratingData.numberOfRatings}</div>
                        <div className="text-xs text-muted-foreground mt-1">Total</div>
                      </div>
                      <div className="text-center p-3 bg-pink-500/5 rounded-lg border border-pink-500/10">
                        <div className="text-2xl font-bold text-pink-500">{ratingData.mostFrequent}</div>
                        <div className="text-xs text-muted-foreground mt-1">Most given</div>
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
          <Card className="border-0 rounded-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)] overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">Taste Report</CardTitle>
                  <CardDescription className="text-base">AI-generated analysis of your media preferences</CardDescription>
                </div>
                <Link href={`/profile/${profile.id}/ai-report`}>
                  <Button 
                    variant="default" 
                    className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 
                              text-white border-0 shadow-md transition-all"
                  >
                    See full AI report
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="relative">
              {/* Decorative accent */}
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-r-full"></div>
              <p className="text-base leading-relaxed pl-4 text-foreground/80">{tasteData?.description || "Loading taste data..."}</p>
            </CardContent>
          </Card>

          <Card className="border-0 rounded-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold tracking-tight">Media Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Select 
                  value={selectedMediaType} 
                  onValueChange={(value) => setSelectedMediaType(value as MediaType | 'all')}
                >
                  <SelectTrigger className="w-[120px] h-9 border border-border/50 rounded-lg">
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button 
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <span className="text-xl font-semibold tracking-tight">{formatYearMonth(currentMonth)}</span>
                  <button 
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border border-border/50 shadow-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={goToToday}
                >
                  Today
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-sm font-medium text-muted-foreground">{day}</div>
                ))}
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
                      <div className="relative w-full h-full opacity-30">
                        <div className="absolute top-1 left-1 text-xs text-muted-foreground">
                          {day > 0 ? day : day + new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 rounded-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold tracking-tight">Media Collection</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">Your personal media collection</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="library" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 p-1 rounded-full bg-muted/50 border border-border/50">
                  <TabsTrigger 
                    value="library" 
                    onClick={() => setActiveTab('library')}
                    className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
                  >
                    Library
                  </TabsTrigger>
                  <TabsTrigger 
                    value="watchlist" 
                    onClick={() => setActiveTab('watchlist')}
                    className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
                  >
                    Watchlist
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="library" className="space-y-4 pt-4">
                  <div className="flex justify-between items-center">
                    <Select
                      value={selectedMediaType}
                      onValueChange={(value) => setSelectedMediaType(value as MediaType | 'all')}
                    >
                      <SelectTrigger className="w-[180px] border border-border/50 rounded-lg">
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

                  <ScrollArea className="h-[400px] pr-4">
                    {activeTab === 'library' ? (
                      isLoadingLibrary ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : libraryEntries.filter(entry => selectedMediaType === 'all' || entry.type === selectedMediaType).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <div className="text-4xl mb-4">📚</div>
                          <p className="text-lg font-medium mb-2">No media added yet</p>
                          <p className="text-muted-foreground max-w-xs">Start adding movies, books, or TV shows to build your collection</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {libraryEntries
                            .filter(entry => selectedMediaType === 'all' || entry.type === selectedMediaType)
                            .map((item) => (
                              <div 
                                key={item.id} 
                                className="flex gap-3 p-3 border border-border/50 rounded-xl hover:shadow-md hover:-translate-y-0.5 
                                          transition-all duration-300 cursor-pointer bg-card"
                                onClick={() => router.push(`/media/${item.mediaId}`)}
                              >
                                <div className="relative w-16 h-24 rounded-lg overflow-hidden shadow-sm">
                                  <Image
                                    src={item.coverImage || "/placeholder.svg"}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                </div>
                                <div className="flex flex-col justify-between flex-1">
                                  <div>
                                    <h3 className="font-medium line-clamp-1">{item.title}</h3>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      {item.type === "movie" && <Film className="h-3 w-3 text-indigo-500" />}
                                      {item.type === "book" && <BookOpen className="h-3 w-3 text-pink-500" />}
                                      {item.type === "tv" && <Tv className="h-3 w-3 text-purple-500" />}
                                      <span className="capitalize">{item.type}</span>
                                      {item.rating > 0 && (
                                        <>
                                          <span>•</span>
                                          <span className="text-amber-500 font-medium">★ {item.rating}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground mt-2">
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
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : watchlist.filter(item => selectedMediaType === 'all' || item.type === selectedMediaType).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <div className="text-4xl mb-4">📋</div>
                          <p className="text-lg font-medium mb-2">Your watchlist is empty</p>
                          <p className="text-muted-foreground max-w-xs">Start adding media to your watchlist to track what you want to experience next</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {watchlist
                            .filter(item => selectedMediaType === 'all' || item.type === selectedMediaType)
                            .map((item) => (
                              <div 
                                key={`${item.type}-${item.id}`} 
                                className="flex gap-3 p-3 border border-border/50 rounded-xl hover:shadow-md hover:-translate-y-0.5 
                                         transition-all duration-300 cursor-pointer bg-card"
                                onClick={() => router.push(`/media/${item.id}`)}
                              >
                                <div className="relative w-16 h-24 rounded-lg overflow-hidden shadow-sm">
                                  <Image
                                    src={item.coverImage || "/placeholder.svg"}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                </div>
                                <div className="flex flex-col justify-between flex-1">
                                  <div>
                                    <h3 className="font-medium line-clamp-1">{item.title}</h3>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      {item.type === "movie" && <Film className="h-3 w-3 text-indigo-500" />}
                                      {item.type === "book" && <BookOpen className="h-3 w-3 text-pink-500" />}
                                      {item.type === "tv" && <Tv className="h-3 w-3 text-purple-500" />}
                                      <span className="capitalize">{item.type}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground mt-2 italic">
                                    On your watchlist
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="watchlist" className="space-y-4 pt-4">
                  <div className="flex justify-between items-center">
                    <Select
                      value={selectedMediaType}
                      onValueChange={(value) => setSelectedMediaType(value as MediaType | 'all')}
                    >
                      <SelectTrigger className="w-[180px] border border-border/50 rounded-lg">
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

                  <ScrollArea className="h-[400px] pr-4">
                    {isLoadingWatchlist ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : watchlist.filter(item => selectedMediaType === 'all' || item.type === selectedMediaType).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="text-4xl mb-4">📋</div>
                        <p className="text-lg font-medium mb-2">Your watchlist is empty</p>
                        <p className="text-muted-foreground max-w-xs">Start adding media to your watchlist to track what you want to experience next</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {watchlist
                          .filter(item => selectedMediaType === 'all' || item.type === selectedMediaType)
                          .map((item) => (
                            <div 
                              key={`${item.type}-${item.id}`} 
                              className="flex gap-3 p-3 border border-border/50 rounded-xl hover:shadow-md hover:-translate-y-0.5 
                                       transition-all duration-300 cursor-pointer bg-card"
                              onClick={() => router.push(`/media/${item.id}`)}
                            >
                              <div className="relative w-16 h-24 rounded-lg overflow-hidden shadow-sm">
                                <Image
                                  src={item.coverImage || "/placeholder.svg"}
                                  alt={item.title}
                                  fill
                                  className="object-cover transition-transform duration-500 hover:scale-105"
                                />
                              </div>
                              <div className="flex flex-col justify-between flex-1">
                                <div>
                                  <h3 className="font-medium line-clamp-1">{item.title}</h3>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    {item.type === "movie" && <Film className="h-3 w-3 text-indigo-500" />}
                                    {item.type === "book" && <BookOpen className="h-3 w-3 text-pink-500" />}
                                    {item.type === "tv" && <Tv className="h-3 w-3 text-purple-500" />}
                                    <span className="capitalize">{item.type}</span>
                                  </div>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground mt-2 italic">
                                  On your watchlist
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
        <DialogContent className="sm:max-w-[500px] border-0 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Edit Favorite {editingMedia.type?.charAt(0).toUpperCase()}{editingMedia.type?.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Search and select your favorite {editingMedia.type} from our database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={`Search for a ${editingMedia.type}...`}
                className="pl-10 py-6 rounded-lg border border-border/50"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  debouncedSearch(e.target.value)
                }}
              />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="relative min-h-[250px]">
              {isSearching ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : searchResults.length > 0 ? (
                <ScrollArea className="h-[250px] pr-4">
                  <div className="space-y-3">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/50 cursor-pointer 
                                  hover:bg-accent hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                        onClick={() => handleSelectMedia(result)}
                      >
                        <div className="relative w-[48px] h-[72px] rounded-lg overflow-hidden shadow-sm">
                          <Image
                            src={result.coverImage || "/placeholder.svg"}
                            alt={result.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-base">{result.title}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            {result.type === "movie" && <Film className="h-3 w-3 text-indigo-500" />}
                            {result.type === "book" && <BookOpen className="h-3 w-3 text-pink-500" />}
                            {result.type === "tv" && <Tv className="h-3 w-3 text-purple-500" />}
                            <span className="capitalize">{result.type}</span>
                            {result.releaseDate && (
                              <>
                                <span>•</span>
                                <span>{new Date(result.releaseDate).getFullYear()}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : searchQuery.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-base font-medium mb-1">
                    {searchQuery.length <= 2 ? "Type at least 3 characters to search" : "No results found"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery.length > 2 ? `Try a different search term for ${editingMedia.type}` : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    <ChatbotLauncher />
    </div>
  )
}