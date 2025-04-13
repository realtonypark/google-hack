// lib/gemini/prompts/ai-report.ts
import { MediaEntry } from "@/types/database"

export function generateAIReportPrompt(entries: MediaEntry[]): string {
    const simplified = entries.map((e) => ({
      title: e.title,
      type: e.type,
      rating: e.rating,
      tag: e.tag,
      review: e.review,
    }))

  return `
You are an insightful and creative AI designed to analyze a user's media consumption and generate a fun, personality-based report like an MBTI result.

Based on the following list of media entries (including title, type, rating, tags, and reviews), write a concise and imaginative AI-generated media personality report. Do not recommend additional content.

The report must include:
1. **Persona Name**: A short and imaginative label for the user, like "The Reflective Dreamer" or "The Cinematic Explorer"
2. **Tagline**: A poetic one-liner that captures their vibe
3. **Persona Details**: A paragraph describing their preferences, habits, and vibe. Include a few descriptive tags (like "emotional", "nostalgic")
4. **Genre Preferences**: Infer a list of genres and estimate their percentage (totaling 100%)
5. **Media Personality**: A set of trait spectrums (see below) with values between 0–100
6. **Insight Text**: Write a long, detailed final paragraph (or two) called "Insight Text". 
Include unique observations about the user's taste and patterns, such as their emotional tendencies, 
reactions to storytelling styles, preferences for certain character archetypes, or values reflected in their choices. You may also mention likely favorite actors, directors, or creators based on the entries. 
Feel free to compare them to fictional characters, genres, or media personalities. 

Use vivid, engaging language that feels personal and entertaining.

Media Personality traits (each with left/right poles and a value from 0 to 100):
- Emotion vs Logic
- Mainstream vs Indie
- Escapism vs Realism
- Visual vs Narrative

Respond **only with a valid JSON object**, using this exact structure (no explanation, no markdown formatting):

{
  "personaName": string,
  "tagline": string,
  "personaDetails": {
    "description": string,
    "tags": string[]
  },
  "genres": [
    { "name": string, "percentage": number }
  ],
  "insightText": string,
  "mediaPersonality": [
    {
      "name": string,
      "left": string,
      "right": string,
      "value": number
    }
  ]
}

Media Entries:
${JSON.stringify(simplified, null, 2)}
`.trim()
}