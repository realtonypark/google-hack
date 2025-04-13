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
  // Define premium chart colors 
  const chartColors = [
    "#6366f1", // indigo-500
    "#8b5cf6", // violet-500
    "#a855f7", // purple-500
    "#d946ef", // fuchsia-500
    "#ec4899", // pink-500
  ]

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-6">
      {/* Cinematic Header */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          Your Media DNA
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          AI-powered analysis of your unique taste profile
        </p>
      </div>

      {/* Persona Summary - with premium styling */}
      <Card className="mb-10 overflow-hidden border-0 rounded-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)] relative">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-bl from-indigo-500/10 to-transparent opacity-60 rounded-xl"></div>
        
        <div className="relative z-10">
          <CardHeader className="pb-2">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight">{report.personaName}</CardTitle>
              <CardDescription className="text-base">{report.tagline}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-2">
              {report.personaDetails.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 
                             hover:bg-indigo-100 dark:hover:bg-indigo-900/50 backdrop-blur-sm border border-indigo-200/50
                             dark:border-indigo-800/50 px-2.5 py-0.5 rounded-full font-medium"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Two column premium layout for medium screens and up */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
        {/* Insight Text - with premium styling */}
        <Card className="md:col-span-7 border-0 rounded-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)]">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">What Makes You Unique</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-base">{report.insightText}</p>
          </CardContent>
        </Card>

        {/* Media Personality - with premium styling */}
        <Card className="md:col-span-5 border-0 rounded-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)]">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">Media Personality</CardTitle>
            <CardDescription className="text-base">How you approach stories and experiences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {report.mediaPersonality.map((trait) => (
              <div key={trait.name} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-foreground/70">{trait.left}</span>
                  <span className="text-foreground/70">{trait.right}</span>
                </div>
                <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {/* Slider marker instead of a progress bar */}
                  <div className="absolute top-0 bottom-0 w-full">
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 
                               shadow-[0_0_10px_rgba(99,102,241,0.5)] z-10"
                      style={{ left: `calc(${trait.value}% - 8px)` }}
                    ></div>
                    {/* Track lines for orientation */}
                    <div className="absolute left-[25%] top-0 bottom-0 w-px h-full bg-slate-300 dark:bg-slate-700"></div>
                    <div className="absolute left-[50%] top-0 bottom-0 w-px h-full bg-slate-300 dark:bg-slate-700"></div>
                    <div className="absolute left-[75%] top-0 bottom-0 w-px h-full bg-slate-300 dark:bg-slate-700"></div>
                  </div>
                </div>
                <div className="text-xs text-center font-medium text-foreground/60 mt-1">{trait.name}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Genre Chart - with premium styling */}
      <Card className="border-0 rounded-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)]">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">Genre Preferences</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={report.genres} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              className="[&_.recharts-cartesian-grid-horizontal_line]:stroke-slate-200 
                         [&_.recharts-cartesian-grid-horizontal_line]:stroke-dasharray-[3,3]
                         dark:[&_.recharts-cartesian-grid-horizontal_line]:stroke-slate-700"
            >
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'var(--foreground)', opacity: 0.8 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                tick={{ fill: 'var(--foreground)', opacity: 0.8 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  color: 'var(--card-foreground)',
                  padding: '12px'
                }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                formatter={(value) => [`${value}%`, 'Percentage']}
              />
              <Bar 
                dataKey="percentage" 
                radius={[6, 6, 0, 0]}
                animationDuration={1500}
                className="[&_path]:transition-all [&_path]:duration-300 
                           [&_path:hover]:opacity-80 [&_path]:cursor-pointer"
              >
                {report.genres.map((entry, index) => (
                  <rect key={`rect-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}