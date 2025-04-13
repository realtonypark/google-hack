"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/lib/authContext"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Loader2, BookOpen, Film, Tv, ChevronRight } from "lucide-react"
import RecommendationSection from "@/components/recommendation-section"
import MediaSearchResults from "@/components/media-search-results"
import { MediaItem, MediaType, UserProfile } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"
import { useDebouncedCallback } from 'use-debounce'
import { Timestamp } from 'firebase/firestore'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAllUsers } from "@/lib/firebase/firestore"
import { RatingDistribution } from "@/components/rating-distribution"
import ChatbotLauncher from "@/components/ChatbotLauncher"

export default function HomeFeed() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<MediaType | 'user'>('movie')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleMediaSelect = useCallback((media: MediaItem) => {
    router.push(`/media/${media.id}`)
  }, [router])

  const performSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setUserSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
    try {
      if (selectedType === 'user') {
        // Search only users
        const filteredUsers = users.filter(user => 
          user.displayName?.toLowerCase().includes(query.toLowerCase())
        );
        setUserSearchResults(filteredUsers);
        setSearchResults([]);
        
        if (filteredUsers.length === 0) {
          setSearchError(`No users found for "${query}"`);
        }
      } else {
        // Search only media
        const mediaResponse = await fetch(`/api/media/search?q=${encodeURIComponent(query)}${selectedType ? `&type=${selectedType}` : ''}`);
        setUserSearchResults([]);
        
        let mediaResults: MediaItem[] = [];
        if (!mediaResponse.ok) {
          setSearchResults([]);
        } else {
          const results = await mediaResponse.json();
          if (Array.isArray(results)) {
            setSearchResults(results);
            mediaResults = results;
          } else {
            setSearchResults([]);
          }
        }
        
        if (mediaResults.length === 0) {
          setSearchError(`No results found for "${query}"`);
        }
      }
    } catch {
      setSearchResults([]);
      setUserSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    performSearch(value);
  };

  const formatDate = (date: Date | Timestamp) => {
    const jsDate = date instanceof Date ? date : date.toDate();
    return jsDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSearchPlaceholder = () => {
    switch (selectedType) {
      case 'movie':
        return "Search movies...";
      case 'tv':
        return "Search TV shows...";
      case 'book':
        return "Search books...";
      case 'user':
        return "Search users...";
      default:
        return "Search movies...";
    }
  };

  // Move loading check after all hooks
  if (loading) {
    return (
      <div className="container py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-10 max-w-6xl mx-auto">
      {/* Enhanced search section with gradient accent */}
      <div className="space-y-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -z-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full -z-10 blur-2xl"></div>
        
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            Discover Your Next Favorite
          </h1>
          <p className="text-muted-foreground mb-6">
            Search for movies, TV shows, books, or connect with other users
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2 flex-wrap justify-center">
            <Button
              variant={selectedType === 'movie' ? 'default' : 'outline'}
              size="sm"
              className={selectedType === 'movie' 
                ? "bg-indigo-500 hover:bg-indigo-600 text-white border-0 shadow-md" 
                : "border border-border/50 shadow-sm hover:border-indigo-300 hover:text-indigo-600"}
              onClick={() => setSelectedType('movie')}
            >
              <Film className="mr-2 h-4 w-4" />
              Movies
            </Button>
            <Button
              variant={selectedType === 'tv' ? 'default' : 'outline'}
              size="sm"
              className={selectedType === 'tv' 
                ? "bg-purple-500 hover:bg-purple-600 text-white border-0 shadow-md" 
                : "border border-border/50 shadow-sm hover:border-purple-300 hover:text-purple-600"}
              onClick={() => setSelectedType('tv')}
            >
              <Tv className="mr-2 h-4 w-4" />
              TV Shows
            </Button>
            <Button
              variant={selectedType === 'book' ? 'default' : 'outline'}
              size="sm"
              className={selectedType === 'book' 
                ? "bg-pink-500 hover:bg-pink-600 text-white border-0 shadow-md" 
                : "border border-border/50 shadow-sm hover:border-pink-300 hover:text-pink-600"}
              onClick={() => setSelectedType('book')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Books
            </Button>
            <Button
              variant={selectedType === 'user' ? 'default' : 'outline'}
              size="sm"
              className={selectedType === 'user' 
                ? "bg-fuchsia-500 hover:bg-fuchsia-600 text-white border-0 shadow-md" 
                : "border border-border/50 shadow-sm hover:border-fuchsia-300 hover:text-fuchsia-600"}
              onClick={() => setSelectedType('user')}
            >
              <Search className="mr-2 h-4 w-4" />
              Users
            </Button>
          </div>

          <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={getSearchPlaceholder()}
              className="pl-10 py-6 pr-10 rounded-full border border-border/50 shadow-md focus-visible:ring-2 focus-visible:ring-primary/30 transition-all"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>

      {searchResults.length > 0 || userSearchResults.length > 0 ? (
        <div className="space-y-10 fade-in">
          {searchResults.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-6 border-b pb-2">Media Results</h3>
              <MediaSearchResults
                results={searchResults}
                onSelect={handleMediaSelect}
                formatDate={formatDate}
              />
            </div>
          )}
          
          {userSearchResults.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-6 border-b pb-2">User Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userSearchResults.map((user) => (
                  <div 
                    key={user.uid}
                    className="flex flex-col gap-4 p-6 border-0 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] 
                                  hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.25)] hover:-translate-y-1
                                  transition-all duration-300 cursor-pointer bg-card"
                    onClick={() => router.push(`/profile/${user.uid}`)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{user.displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user.stats?.totalRatings || 0} ratings • {user.stats?.averageRating?.toFixed(1) || '0.0'} avg
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : searchError ? (
        <div className="text-center text-muted-foreground py-10">
          {searchError}
        </div>
      ) : searchQuery.length >= 2 && !isSearching ? (
        <div className="text-center text-muted-foreground py-10">
          No results found for "{searchQuery}"
        </div>
      ) : (
        <Tabs defaultValue="for-you" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 p-1 rounded-full bg-muted/50 border border-border/50">
            <TabsTrigger 
              value="for-you" 
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              AI Recommendation
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              Users
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="for-you" className="space-y-10 mt-8">
            <RecommendationSection title="Your Picks" description="Recommended based on your library" type="personal" />
            <RecommendationSection
              title="Broaden Your Taste"
              description="Explore beyond your usual genres"
              type="broaden"
            />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-10 mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                Community Members
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover other users and their favorite media
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {isLoadingUsers ? (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : (
                users.map((user) => (
                  <div 
                    key={user.uid}
                    className="flex flex-col gap-6 p-6 border-0 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] 
                                hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.25)] hover:-translate-y-1
                                transition-all duration-300 cursor-pointer bg-card"
                    onClick={() => router.push(`/profile/${user.uid}`)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{user.displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user.stats?.totalRatings || 0} ratings • {user.stats?.averageRating?.toFixed(1) || '0.0'} avg
                        </p>
                      </div>
                      <Button 
                        variant="default" 
                        className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 
                                  text-white border-0 shadow-md transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/profile/${user.uid}/ai-report`);
                        }}
                      >
                        AI taste report
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {user.favoriteMedia && (
                        <div>
                          <h4 className="text-base font-medium mb-4 border-b pb-2">Favorite Media</h4>
                          <div className="flex gap-4">
                            {(['book', 'movie', 'tv'] as const).map((type) => (
                              <div key={type} className="flex-1">
                                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-md">
                                  {user.favoriteMedia?.[type] && (
                                    <img
                                      src={user.favoriteMedia[type].coverImage}
                                      alt={user.favoriteMedia[type].title}
                                      className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                                    />
                                  )}
                                </div>
                                <div className="mt-2 flex justify-center">
                                  <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-full border border-border/50 shadow-sm">
                                    {type === 'movie' && <Film className="h-3 w-3 text-indigo-500" />}
                                    {type === 'book' && <BookOpen className="h-3 w-3 text-pink-500" />}
                                    {type === 'tv' && <Tv className="h-3 w-3 text-purple-500" />}
                                    <span className="text-xs font-medium capitalize">
                                      {type === 'tv' ? 'Series' : type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-base font-medium mb-4 border-b pb-2">Rating Distribution</h4>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <div className="text-2xl font-bold text-primary">{user.stats?.averageRating?.toFixed(1) || '0.0'}</div>
                            <div className="text-xs text-muted-foreground mt-1">Average Rating</div>
                          </div>
                          <div className="text-center p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                            <div className="text-2xl font-bold text-purple-500">{user.stats?.totalRatings || 0}</div>
                            <div className="text-xs text-muted-foreground mt-1">Total Ratings</div>
                          </div>
                          <div className="text-center p-3 bg-pink-500/5 rounded-lg border border-pink-500/10">
                            <div className="text-2xl font-bold text-pink-500">
                              {Object.entries(user.stats?.ratingDistribution || {})
                                .sort(([,a], [,b]) => b - a)[0]?.[0] || '0.0'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Most frequent</div>
                          </div>
                        </div>
                        {user.stats?.ratingDistribution && (
                          <RatingDistribution 
                            distribution={user.stats.ratingDistribution}
                            totalRatings={Object.values(user.stats.ratingDistribution).reduce((a, b) => a + b, 0)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
      <ChatbotLauncher />
    </div>
  )
}
