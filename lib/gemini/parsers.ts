export type ParsedRecommendation = {
  title: string
  year?: string
  type?: "movie" | "tv" | "book"
}

export function parseRecommendationResponse(response: string): ParsedRecommendation[] {
  console.log("🔍 Parsing Gemini response...");

  const parseSectionMarker = "🔽";
  const parseMarkerIndex = response.indexOf(parseSectionMarker);

  let contentToParse = response;

  if (parseMarkerIndex !== -1) {
    console.log("📋 Found parse-friendly section");
    contentToParse = response.slice(parseMarkerIndex);
  }

  const matches: ParsedRecommendation[] = [];
  const lines = contentToParse
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0 && /^\d+\./.test(line));

  for (const line of lines) {
    // Remove "1. " prefix
    const withoutNumber = line.replace(/^\d+\.\s*/, "");

    // Match "Title (Year) - Type"
    const fullMatch = withoutNumber.match(/^(.*?)\s*\((\d{4}(?:-\d{4})?)\)\s*-\s*(movie|tv|book)$/i);
    if (fullMatch) {
      matches.push({
        title: fullMatch[1].trim(),
        year: fullMatch[2],
        type: fullMatch[3].toLowerCase() as "movie" | "tv" | "book"
      });
      continue;
    }

    // Match "Title (Year)" without type
    const fallbackMatch = withoutNumber.match(/^(.*?)\s*\((\d{4}(?:-\d{4})?)\)$/);
    if (fallbackMatch) {
      matches.push({
        title: fallbackMatch[1].trim(),
        year: fallbackMatch[2]
      });
      continue;
    }

    // If only title
    matches.push({ title: withoutNumber });
  }

  console.log("✅ Parsed recommendations:", matches);
  return matches;
}