// lib/gemini/parsers.ts

export type ParsedRecommendation = {
  title: string
  year?: string
}

export function parseRecommendationResponse(response: string): ParsedRecommendation[] {
  console.log("🔍 Parsing Gemini response...");
  
  // Look for the parse-friendly section identified by 🔽 symbol
  const parseSectionMarker = "🔽";
  const parseMarkerIndex = response.indexOf(parseSectionMarker);
  
  let contentToParse = response;
  
  // If we find the parse-friendly section, prioritize it
  if (parseMarkerIndex !== -1) {
    console.log("📋 Found parse-friendly section");
    contentToParse = response.slice(parseMarkerIndex);
  }
  
  // First try to match numbered list items with title and year pattern: "1. Title (Year)"
  const numberedPattern = /\d+\.\s+(.*?)\s*\((\d{4}(?:-\d{4})?)\)/g;
  let matches = [];
  let match;
  
  while ((match = numberedPattern.exec(contentToParse)) !== null) {
    matches.push({
      title: match[1].replace(/^\*|\*$/g, '').trim(), // Remove asterisks
      year: match[2]
    });
  }
  
  // If we found matches, return them
  if (matches.length > 0) {
    console.log("✅ Parsed recommendations from numbered list:", matches);
    return matches;
  }
  
  // Second attempt: look for lines that start with numbers and extract content
  const lines = contentToParse
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => /^\d+\./.test(line));
  
  console.log("📝 Found these potential recommendation lines:", lines);
  
  if (lines.length > 0) {
    return lines.map(line => {
      // Remove the number prefix
      const content = line.replace(/^\d+\.\s*/, "").trim();
      
      // Remove asterisks that might be used for italics
      const cleanContent = content.replace(/^\*|\*$/g, '');
      
      // Try to match "Title (Year)" pattern
      const yearMatch = cleanContent.match(/(.*?)\s*\((\d{4}(?:-\d{4})?)\)/);
      
      if (yearMatch) {
        return {
          title: yearMatch[1].trim(),
          year: yearMatch[2]
        };
      }
      
      // If no year found, just return the title
      return { title: cleanContent };
    });
  }
  
  // If no recommendations found, return empty array
  console.warn("⚠️ Could not extract recommendations from Gemini response");
  return [];
}