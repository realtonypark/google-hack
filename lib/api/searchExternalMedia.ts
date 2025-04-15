import { MediaItem } from "@/types/database"
import { searchBooks, searchMovies, searchTVShows } from "@/lib/services/externalMediaService"

export async function searchExternalMedia(
  title: string,
  year?: string,
  type?: "movie" | "tv" | "book"
): Promise<MediaItem | null> {
  const lowerTitle = title.toLowerCase()

  const tryMatch = (items: MediaItem[]) =>
    items.find(item =>
      item.title.toLowerCase() === lowerTitle &&
      (!year || item.releaseDate?.startsWith(year))
    ) || items[0]

  // Type-specific search first
  if (type === "movie") {
    const movies = await searchMovies(title)
    const match = tryMatch(movies)
    if (match) return match
  }

  if (type === "tv") {
    const tv = await searchTVShows(title)
    const match = tryMatch(tv)
    if (match) return match
  }

  if (type === "book") {
    const books = await searchBooks(title)
    const match = tryMatch(books)
    if (match) return match
  }

  // Fallback search (if type was undefined or no match found)
  if (!type || type !== "movie") {
    const movies = await searchMovies(title)
    const match = tryMatch(movies)
    if (match) return match
  }

  if (!type || type !== "tv") {
    const tv = await searchTVShows(title)
    const match = tryMatch(tv)
    if (match) return match
  }

  if (!type || type !== "book") {
    const books = await searchBooks(title)
    const match = tryMatch(books)
    if (match) return match
  }

  return null
}