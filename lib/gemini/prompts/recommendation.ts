export function generateRecommendationPrompt(profile: string, type: "personal" | "broaden"): string {
    const sharedInstructions = `
  Output format:
  1. Title (Year)
  
  🔽 At the end of your response, include a parse-friendly summary list of the recommendations:
  Format each line as:  
  1. Title (Year)  
  2. Title (Year)  
  3. Title (Year)  
  4. Title (Year)  
  5. Title (Year)
  6. Title (Year)
  7. Title (Year)
  8. Title (Year)
  9. Title (Year)
  10. Title (Year)

  If no year is available, just write the title.
  `;
  
    if (type === "personal") {
      return `
  [User Profile Summary]
  ${profile}
  
  [Task]
  Based on the user profile above, recommend 10 pieces of media (movies, TV shows, or books) that closely match the user's known preferences. When you start, state what media in the library you use to analyze the user's preference.
  
  Guidelines:
  - All recommendations should align strongly with the user's past likes in terms of genre, theme, tone, and style.
  - Focus entirely on reinforcing the user's current preferences.
  - Each item should include the title, release year
  
  ${sharedInstructions}
  `;
    }
  
    return `
  [User Profile Summary]
  ${profile}
  
[Task]
Recommend 10 media items that serve as "stepping stones" to expand tastes while maintaining organic relevance.

Guidelines:
1. **Bridge Ratio**  
   15% connection to existing preferences (genre/theme/style)  
   85% novel elements (culture/era/format)

2. **Progressive Exposure**  
   - 3 items: Adjacent genres (e.g. Fantasy → Magical Realism)  
   - 3 items: Cross-cultural adaptations (e.g. UK novel → Japanese film)  
   - 2 items: Temporal shifts (modern → 1970s classics)  
   - 2 items: Format hybrids (graphic novel → live action)

3. **Quality Gate**  
   - Minimum 7.0 IMDB/Goodreads rating    
  
  ${sharedInstructions}
  `;
  }