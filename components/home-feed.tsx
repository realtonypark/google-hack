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
    return <div className="container py-6 flex justify-center">Loading...</div>
  }

  return (
    <div className="container py-6 space-y-8">
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
            <Button
              variant={selectedType === 'user' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('user')}
            >
              <Search className="mr-2 h-4 w-4" />
              Users
            </Button>
          </div>
        </div>

        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
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
      </div>

      {searchResults.length > 0 || userSearchResults.length > 0 ? (
        <div className="space-y-6">
          {searchResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Media Results</h3>
              <MediaSearchResults
                results={searchResults}
                onSelect={handleMediaSelect}
                formatDate={formatDate}
              />
            </div>
          )}
          
          {userSearchResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">User Results</h3>
              <div className="grid grid-cols-2 gap-6">
                {userSearchResults.map((user) => (
                  <div 
                    key={user.uid}
                    className="flex flex-col gap-4 p-6 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => router.push(`/profile/${user.uid}`)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{user.displayName}</h3>
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
        <div className="text-center text-muted-foreground">
          {searchError}
        </div>
      ) : searchQuery.length >= 2 && !isSearching ? (
        <div className="text-center text-muted-foreground">
          No results found for "{searchQuery}"
        </div>
      ) : (
        <Tabs defaultValue="for-you" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="for-you">AI Recommendation</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="for-you" className="space-y-8 mt-6">
            <RecommendationSection title="Your Picks" description="Recommended based on your library" type="personal" />
            <RecommendationSection
              title="Broaden Your Taste"
              description="Explore beyond your usual genres"
              type="broaden"
            />
          </TabsContent>
          <TabsContent value="users" className="space-y-8 mt-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Users</h2>
              <p className="text-sm text-muted-foreground">Discover other users and their favorite media</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {isLoadingUsers ? (
                <div className="col-span-2 flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                users.map((user) => (
                  <div 
                    key={user.uid}
                    className="flex flex-col gap-4 p-6 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => router.push(`/profile/${user.uid}`)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">{user.displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user.stats?.totalRatings || 0} ratings • {user.stats?.averageRating?.toFixed(1) || '0.0'} avg
                        </p>
                      </div>
                      <Button 
                        variant="default" 
                        className="bg-pink-500 hover:bg-pink-600 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/profile/${user.uid}/analysis`);
                        }}
                      >
                        See AI taste report
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {user.favoriteMedia && (
                        <div>
                          <h4 className="text-lg font-semibold mb-4">Favorite Media</h4>
                          <div className="flex gap-4">
                            {(['book', 'movie', 'tv'] as const).map((type) => (
                              <div key={type} className="flex-1">
                                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
                                  {user.favoriteMedia?.[type] && (
                                    <img
                                      src={user.favoriteMedia[type].coverImage}
                                      alt={user.favoriteMedia[type].title}
                                      className="object-cover w-full h-full"
                                    />
                                  )}
                                </div>
                                <div className="mt-2 flex justify-center">
                                  <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full">
                                    {type === 'movie' && <Film className="h-4 w-4" />}
                                    {type === 'book' && <BookOpen className="h-4 w-4" />}
                                    {type === 'tv' && <Tv className="h-4 w-4" />}
                                    <span className="text-sm capitalize">
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
                        <h4 className="text-lg font-semibold mb-4">Rating Distribution</h4>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{user.stats?.averageRating?.toFixed(1) || '0.0'}</div>
                            <div className="text-sm text-muted-foreground">Average Rating</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{user.stats?.totalRatings || 0}</div>
                            <div className="text-sm text-muted-foreground">Number of Ratings</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {Object.entries(user.stats?.ratingDistribution || {})
                                .sort(([,a], [,b]) => b - a)[0]?.[0] || '0.0'}
                            </div>
                            <div className="text-sm text-muted-foreground">Most frequent</div>
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
    </div>
  )
}