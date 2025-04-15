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
    <div className="container py-8 space-y-10 max-w-6xl mx-auto relative">
      {/* Enhanced search section with gradient accent */}
      <div className="space-y-6 relative z-10">
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
            <div className="relative w-full max-w-md mx-auto">
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
              {searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 w-full z-50 bg-background mt-4 px-4 py-6 shadow-xl rounded-xl">
                  {isSearching ? (
                    <div className="text-center text-muted-foreground py-4">
                      <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                      Searching...
                    </div>
                  ) : searchResults.length > 0 || userSearchResults.length > 0 ? (
                    <div className="space-y-6 fade-in max-h-[400px] overflow-y-auto">
                      {searchResults.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Media</h3>
                          <MediaSearchResults
                            results={searchResults}
                            onSelect={handleMediaSelect}
                            formatDate={formatDate}
                          />
                        </div>
                      )}
                      {userSearchResults.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Users</h3>
                          <ul className="space-y-2">
                            {userSearchResults.map((user) => (
                              <li
                                key={user.uid}
                                className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                                onClick={() => router.push(`/profile/${user.uid}`)}
                              >
                                <Avatar className="h-8 w-8 border">
                                  <AvatarImage src={user.photoURL || undefined} />
                                  <AvatarFallback>
                                    {user.displayName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{user.displayName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {user.stats?.totalRatings || 0} ratings
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  
      {/* 🧠 Always show Tabs (recommendations + users) */}
      <Tabs defaultValue="for-you" className="w-full relative z-0">
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
          <RecommendationSection title="Broaden Your Taste" description="Explore beyond your usual genres" type="broaden" />
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
                <div key={user.uid} className="..."> {/* 기존 user 카드 렌더링 유지 */}</div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      <ChatbotLauncher />
    </div>
  )
}