"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import Image from "next/image"
import { AIReport } from "@/types/ai-report"

interface AIReportViewProps {
  profile: any
  report: AIReport
}

export default function AIReportView({ profile, report }: AIReportViewProps) {
  return (
    <div className="container py-10 space-y-8">
      {/* Persona Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{report.personaName}</CardTitle>
          <CardDescription>{report.tagline}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {report.personaDetails.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </CardContent>
      </Card>
      {/* Insight Text */}
      <Card>
        <CardHeader>
          <CardTitle>What Makes You Unique</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{report.insightText}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Media Personality</CardTitle>
            <CardDescription>How you approach stories and experiences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {report.mediaPersonality.map((trait) => (
            <div key={trait.name}>
                <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                <span>{trait.left}</span>
                <span>{trait.right}</span>
                </div>
                <div className="relative h-2 rounded-full bg-muted">
                <div
                    className="absolute top-0 h-2 rounded-full bg-pink-500"
                    style={{ width: `${trait.value}%` }}
                />
                </div>
                <div className="mt-1 text-xs text-center text-muted-foreground">{trait.name}</div>
            </div>
            ))}
        </CardContent>
      </Card>
      {/* Genre Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Genre Preferences</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.genres}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percentage" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}