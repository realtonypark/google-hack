import { notFound, redirect } from "next/navigation"
import { getServerUser } from "@/lib/getServerUser"
import { getUserProfile } from "@/lib/api"
import { getUserMediaEntries } from "@/lib/firebase/firestore"
import { generateAIReportPrompt } from "@/lib/gemini/prompts/ai-report"
import { callGemini } from "@/lib/gemini/client"
import AIReportView from "@/components/ai-report-view"
import { AIReport } from "@/types/ai-report"

export const dynamic = "force-dynamic"

type Params = {
  username: string
}

export default async function AIReportPage({ params }: { params: Promise<Params> }) {
  const { username } = await params;

  const user = await getServerUser()
  if (!user) redirect("/login")

  const profile = await getUserProfile(username);
  if (!profile) notFound()

  const entries = await getUserMediaEntries(profile.id)
  if (!entries || entries.length === 0) notFound()

  const prompt = generateAIReportPrompt(entries)
  const geminiResponse = await callGemini(prompt)
  const cleaned = geminiResponse
  .replace(/^```json/, "")
  .replace(/^```/, "")
  .replace(/```$/, "")
  .trim()

  let report: AIReport
  try {
    report = JSON.parse(cleaned)
  } catch (err) {
    console.error("❌ Failed to parse Gemini response:", geminiResponse)
    throw new Error("Invalid JSON format from Gemini")
  }

  return <AIReportView profile={profile} report={report} />
}