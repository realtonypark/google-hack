// lib/recommendations/getRecommendations.ts

import { getUserMediaLogs } from "@/lib/firebase/userLogs" // 🔧 너가 나중에 연결해야 할 유저 로그 함수
import { generateUserProfilePrompt } from "@/lib/gemini/prompts/profile"
import { generateRecommendationPrompt } from "@/lib/gemini/prompts/recommendation"
import { callGemini } from "@/lib/gemini/client"
import { parseRecommendationResponse } from "@/lib/gemini/parsers"
import { matchRecommendationsFromFirestore } from "@/lib/gemini/matcher"

import { MediaItem } from "@/types/database"
import { UserMediaLog } from "@/types/gemini"

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
  const logs: UserMediaLog[] = await getUserMediaLogs(userId)
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

  return matchedMedia
}