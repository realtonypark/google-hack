// app/api/ai-report/route.ts

import { NextRequest, NextResponse } from "next/server"
import { callGemini } from "@/lib/gemini/client"

export async function POST(req: NextRequest) {
  try {
    const { profile } = await req.json()

    if (!profile) {
      return NextResponse.json({ error: "Missing profile" }, { status: 400 })
    }

    const prompt = `Analyze this user's media taste based on the following data:\n\n${JSON.stringify(profile.favoriteMedia, null, 2)}\n\nGive a short but insightful report.`
    const report = await callGemini(prompt)

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Error generating AI report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}