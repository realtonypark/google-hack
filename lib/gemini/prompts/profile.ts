import { MediaEntry } from "@/types/database"

export function generateUserProfilePrompt(logs: MediaEntry[]): string {
  const snapshot = logs.map((item, idx) => {
    const stars = "★".repeat(Math.round(item.rating || 0)) || "☆"

    let entry = `${idx + 1}. "${item.title}" (${item.type}, ${stars})`

    if (item.tag) {
      entry += `\n   - Tags: ${item.tag}`
    }

    if (item.review) {
      const review = item.review.replace(/\n+/g, " ").trim()
      entry += `\n   - Review: ${review}`
    }

    return entry
  }).join("\n")

  return `
[User Library Snapshot]
Below is a sample of the user's media consumption history, including titles they rated highly or wrote reviews for.

${snapshot}

[Task]
Based on the media shown above, analyze the user's preferences.

Please identify:
- Frequently liked genres, themes, and tones
- Patterns in tags or emotional responses from reviews
- Possible dislikes or avoidance patterns

Summarize the user's taste in clear and concise natural language. Do not recommend anything yet.
`
}