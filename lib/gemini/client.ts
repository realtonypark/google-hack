// lib/gemini/client.ts

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

type GeminiResponse = {
  candidates?: {
    content: {
      parts: { text: string }[]
    }
  }[]
}

export async function callGemini(prompt: string): Promise<string> {
  if (!API_KEY) throw new Error("Missing Gemini API key")

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  }

  try {
    const res = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`Gemini request failed: ${res.status} ${res.statusText}`)
    }

    const json = (await res.json()) as GeminiResponse
    console.log("Gemini raw response:", JSON.stringify(json, null, 2))
    
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error("No content returned from Gemini")
    }

    return text.trim()
  } catch (err) {
    console.error("Gemini error:", err)
    throw err
  }
}