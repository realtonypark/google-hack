"use client"

import { useState, useCallback } from "react"
import { useAuth } from "@/lib/authContext"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Loader2, BookOpen, Film, Tv } from "lucide-react"
import RecommendationSection from "@/components/recommendation-section"
import MediaSearchResults from "@/components/media-search-results"
import { MediaItem, MediaType } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"
import { useDebouncedCallback } from 'use-debounce'
import { Timestamp } from 'firebase/firestore'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function HomeFeed() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<MediaType>('movie')
  const router = useRouter()

  const handleMediaSelect = useCallback((media: MediaItem) => {
    router.push(`/media/${media.id}`)
  }, [router])

  const performSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
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
      
      if (results.length === 0) {
        setSearchError(`No results found for "${query}"`);
      }
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

      {searchResults.length > 0 && (
        <MediaSearchResults
          results={searchResults}
          onSelect={handleMediaSelect}
          formatDate={formatDate}
        />
      )}

      {searchError ? (
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
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
          <TabsContent value="for-you" className="space-y-8 mt-6">
            <RecommendationSection title="Your Picks" description="Recommended based on your library" type="personal" />
            <RecommendationSection
              title="Broaden Your Taste"
              description="Explore beyond your usual genres"
              type="broaden"
            />
            {/* Conditionally show this section if user has friends */}
            <RecommendationSection
              title="Popular Among Friends"
              description="What your connections are enjoying"
              type="friends"
            />
          </TabsContent>
          <TabsContent value="trending" className="space-y-8 mt-6">
            <RecommendationSection title="Trending Now" description="Popular across the platform" type="trending" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}