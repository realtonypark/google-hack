import { UserMediaLog } from "@/types/gemini"
export function generateUserProfilePrompt(logs: UserMediaLog[]): string {
  const snapshot = logs.map((item, idx) => {
    const stars = "★".repeat(Math.round(item.rating))
    return `${idx + 1}. "${item.title}" (${item.type}, ${stars})` +
      (item.tag ? `\n   - Tags: ${item.tag}` : "") +
      (item.review ? `\n   - Review: ${item.review}` : "")
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