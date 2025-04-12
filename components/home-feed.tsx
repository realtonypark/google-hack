"use client"

import { useState, useCallback } from "react"
import { useAuth } from "@/lib/authContext"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Loader2 } from "lucide-react"
import RecommendationSection from "@/components/recommendation-section"
import MediaSearchResults from "@/components/media-search-results"
import { MediaItem } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"
import { useDebouncedCallback } from 'use-debounce'

export default function HomeFeed() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  const performSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
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
      
      if (results.length === 0) {
        setSearchError(`No results found for "${query}"`);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
      
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

  // Move loading check after all hooks
  if (loading) {
    return <div className="container py-6 flex justify-center">Loading...</div>
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
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

      {searchResults.length > 0 ? (
        <div className="max-w-4xl mx-auto">
          <MediaSearchResults results={searchResults} />
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