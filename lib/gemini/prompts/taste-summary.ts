// lib/gemini/prompts/taste-summary.ts

import { MediaEntry } from "@/types/database"

export function generateTasteSummaryPrompt(entries: MediaEntry[]): string {
    const simplified = entries.map((e) => ({
      title: e.title,
      type: e.type,
      rating: e.rating,
      tag: e.tag,
      review: e.review,
    }))

  return `
You are an insightful AI that summarizes users' media preferences in a single paragraph.

Based on the user's logged media (titles, ratings, tags, and reviews), generate a 3–4 sentence description that captures their overall taste. The tone should be friendly and observant, like an MBTI summary.

Respond with ONLY the plain text. No markdown or labels.

Media Entries:
${JSON.stringify(simplified, null, 2)}
`.trim()
}