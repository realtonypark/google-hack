// lib/recommendations/getRecommendations.ts

import { getUserMediaEntries } from "@/lib/firebase/firestore"
import { generateUserProfilePrompt } from "@/lib/gemini/prompts/profile"
import { generateRecommendationPrompt } from "@/lib/gemini/prompts/recommendation"
import { callGemini } from "@/lib/gemini/client"
import { parseRecommendationResponse } from "@/lib/gemini/parsers"
import { matchRecommendationsFromFirestore } from "@/lib/gemini/matcher"

import { MediaItem } from "@/types/database"

export type RecommendationType = "personal" | "broaden"

/**
 * Generates and returns recommended media items for a user by:
 * - Fetching their media logs
 * - Building a profile
 * - Prompting Gemini for recommendations
 * - Matching them against Firestore media database
 */
export async function getRecommendations(type: RecommendationType, userId: string): Promise<MediaItem[]> {
  // Step 1: Load user logs
  const logs = await getUserMediaEntries(userId)

  console.log("📚 User logs loaded:", logs)

  // Step 2: Generate profile summary from logs
  const profilePrompt = generateUserProfilePrompt(logs)

  // Step 3: Generate recommendation prompt from profile summary
  const recommendationPrompt = generateRecommendationPrompt(profilePrompt, type)

  // Step 4: Call Gemini API with final prompt
  const geminiResponse = await callGemini(recommendationPrompt)

  // Step 5: Parse LLM response into title/year pairs
  const parsed = parseRecommendationResponse(geminiResponse)

  // Step 6: Match parsed recommendations to Firestore media
  const matchedMedia = await matchRecommendationsFromFirestore(parsed)
  const isValidMediaItem = (item: MediaItem) => {
    return (
      item.coverImage &&
      !item.coverImage.includes("placeholder") &&
      item.description &&
      item.description !== "This recommended title was not found in our database." &&
      item.description !== "Error finding this recommendation."
    )
  }

  const filtered = matchedMedia.filter(isValidMediaItem)

  return filtered
}