import { NextResponse } from "next/server"
import { callGemini } from "@/lib/gemini/client"
import { getUserMediaEntries } from "@/lib/firebase/firestore"
import { MediaEntry } from "@/types/database"

export async function POST(req: Request) {
    const { message, mediaLog } = await req.json()
  
    try {
      const simplified = (mediaLog as MediaEntry[]).map((e) => ({
        title: e.title,
        type: e.type,
        rating: e.rating,
        tag: e.tag,
        review: e.review,
      }))
  

    const prompt = `
You are a friendly and knowledgeable AI media expert. You help users discover interesting movies, TV shows, and books.

The user has the following media history:
${JSON.stringify(simplified, null, 2)}

They just said:
"${message}"

Based on both their message and media history, reply in a conversational and helpful tone. Feel free to reference things they’ve liked, suggest new options, or ask follow-up questions.

AI:`.trim()

    const reply = await callGemini(prompt)
    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chatbot error:", error)
    return NextResponse.json({ reply: "Sorry, something went wrong!" }, { status: 500 })
  }
}