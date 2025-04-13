// lib/geminiClient.ts
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  throw new Error("Gemini API key is missing")
}

export async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.statusText}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini did not return a valid response")

  return text
}