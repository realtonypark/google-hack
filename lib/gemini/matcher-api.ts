import { ParsedRecommendation } from "./parsers"
import { MediaItem } from "@/types/database"
import { searchExternalMedia } from "@/lib/api/searchExternalMedia" // 우리가 정의할 API 매칭 함수

export async function matchRecommendationsViaAPI(parsed: ParsedRecommendation[]): Promise<MediaItem[]> {
  const results: MediaItem[] = []

  for (const rec of parsed) {
    try {
      const result = await searchExternalMedia(rec.title, rec.year, rec.type)
      if (result) {
        results.push(result)
      } else {
        results.push(createPlaceholder(rec, "not-found"))
      }
    } catch (err) {
      console.error(`Error matching "${rec.title}" (${rec.year}):`, err)
      results.push(createPlaceholder(rec, "error"))
    }
  }

  return results
}

function createPlaceholder(rec: ParsedRecommendation, type: "error" | "not-found"): MediaItem {
  return {
    id: `${type}-${rec.title.replace(/\W+/g, "-")}`,
    title: rec.title,
    year: rec.year || "Unknown",
    type: "movie",
    coverImage: "/placeholder.jpg",
    genres: ["Recommended"],
    description: type === "error"
      ? "Error finding this recommendation."
      : "This recommended title was not found in our database.",
    isFeatured: false,
    isNew: false,
  }
}