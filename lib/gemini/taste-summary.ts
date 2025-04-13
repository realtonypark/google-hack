// lib/gemini/taste-summary.ts
import { MediaEntry } from "@/types/database"
import { generateTasteSummaryPrompt } from "@/lib/gemini/prompts/taste-summary"
import { callGemini } from "@/lib/gemini/client"

export async function generateTasteSummary(entries: MediaEntry[]): Promise<string> {
  const prompt = generateTasteSummaryPrompt(entries)
  const response = await callGemini(prompt)
  return response.trim()
}