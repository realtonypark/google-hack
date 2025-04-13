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
  Recommend 10 media items (movies, TV shows, or books) that help the user expand their tastes, while still maintaining some degree of relevance to their existing preferences.
  
  Guidelines:
  - Maintain 15% alignment with the user's known preferences.
  - Introduce 85% novelty through new genres, countries, or historical periods.
  - Prioritize famous, well known media
  - At least 1 recommendation should be from an underrepresented region or non-mainstream genre.
  - Each item should include the title, release year
  
  ${sharedInstructions}
  `;
  }