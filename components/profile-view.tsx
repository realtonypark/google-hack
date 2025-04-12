"use client"

import { useState } from "react"
import Image from "next/image"
import { CalendarIcon, BookOpen, Film, Tv, ListChecks } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ProfileViewProps {
  profile: any
  isOwnProfile: boolean
}

export default function ProfileView({ profile, isOwnProfile }: ProfileViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Mock data for demo
  const mockLibrary = [
    {
      id: "1",
      title: "The Shawshank Redemption",
      type: "movie",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "1994",
      genres: ["Drama"],
      dateAdded: "2023-10-15",
    },
    {
      id: "2",
      title: "The Lord of the Rings",
      type: "book",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "1954",
      genres: ["Fantasy", "Adventure"],
      dateAdded: "2023-11-20",
    },
    {
      id: "3",
      title: "Breaking Bad",
      type: "series",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "2008",
      genres: ["Crime", "Drama", "Thriller"],
      dateAdded: "2023-12-05",
    },
  ]

  const mockWatchlist = [
    {
      id: "4",
      title: "Inception",
      type: "movie",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "2010",
      genres: ["Sci-Fi", "Action"],
    },
    {
      id: "5",
      title: "1984",
      type: "book",
      coverImage: "/placeholder.svg?height=400&width=250",
      year: "1949",
      genres: ["Dystopian", "Sci-Fi"],
    },
  ]

  // Mock taste data
  const tasteData = {
    description:
      "You're a cinematic explorer with a penchant for thought-provoking narratives. Your media choices reveal a mind that enjoys complex characters and intricate plots. While you appreciate the occasional blockbuster, you're drawn to stories that challenge conventions and offer fresh perspectives.",
    genres: [
      { name: "Drama", percentage: 35 },
      { name: "Sci-Fi", percentage: 25 },
      { name: "Thriller", percentage: 20 },
      { name: "Fantasy", percentage: 15 },
      { name: "Comedy", percentage: 5 },
    ],
    favoriteMedia: {
      book: {
        title: "The Lord of the Rings",
        coverImage: "/placeholder.svg?height=400&width=250",
      },
      movie: {
        title: "The Shawshank Redemption",
        coverImage: "/placeholder.svg?height=400&width=250",
      },
      series: {
        title: "Breaking Bad",
        coverImage: "/placeholder.svg?height=400&width=250",
      },
    },
  }

  return (
    <div className="container py-10">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
              <div className="relative w-32 h-32">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profile.image || "/placeholder.svg?height=128&width=128"} />
                  <AvatarFallback>{profile.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button size="icon" variant="outline" className="absolute bottom-0 right-0 rounded-full">
                    <span className="sr-only">Edit Avatar</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </Button>
                )}
              </div>
              <CardTitle className="mt-4">{profile.name}</CardTitle>
              <CardDescription>@{profile.username}</CardDescription>

              <div className="flex gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.following || 0}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.followers || 0}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
              </div>

              {!isOwnProfile && <Button className="mt-4 w-full">Follow</Button>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Favorite Media</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden mb-1">
                        <Image
                          src={tasteData.favoriteMedia.book.coverImage || "/placeholder.svg"}
                          alt={tasteData.favoriteMedia.book.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          <BookOpen className="h-3 w-3 mr-1" />
                          Book
                        </Badge>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden mb-1">
                        <Image
                          src={tasteData.favoriteMedia.movie.coverImage || "/placeholder.svg"}
                          alt={tasteData.favoriteMedia.movie.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          <Film className="h-3 w-3 mr-1" />
                          Movie
                        </Badge>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden mb-1">
                        <Image
                          src={tasteData.favoriteMedia.series.coverImage || "/placeholder.svg"}
                          alt={tasteData.favoriteMedia.series.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          <Tv className="h-3 w-3 mr-1" />
                          Series
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Taste Breakdown</h3>
                  <div className="space-y-2">
                    {tasteData.genres.map((genre) => (
                      <div key={genre.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{genre.name}</span>
                          <span>{genre.percentage}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${genre.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Taste Report</CardTitle>
              <CardDescription>AI-generated analysis of your media preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{tasteData.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Media Calendar</CardTitle>
              <CardDescription>Track your media consumption over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />

              {date && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Media on {date.toLocaleDateString()}</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {/* This would show media consumed on the selected date */}
                    <div className="relative min-w-[100px] aspect-[2/3] rounded-md overflow-hidden">
                      <Image
                        src="/placeholder.svg?height=200&width=150"
                        alt="Media poster"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Tabs defaultValue="library">
                <div className="flex items-center justify-between">
                  <CardTitle>Media Collection</CardTitle>
                  <TabsList>
                    <TabsTrigger value="library">Library</TabsTrigger>
                    <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>Your personal media collection</CardDescription>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="library">
                <TabsContent value="library" className="mt-0">
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                      {mockLibrary.map((item) => (
                        <div key={item.id} className="flex gap-3 p-2 border rounded-lg">
                          <div className="w-16 h-24 relative overflow-hidden rounded">
                            <img
                              src={item.coverImage || "/placeholder.svg"}
                              alt={item.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex flex-col justify-between">
                            <div>
                              <h3 className="font-medium line-clamp-1">{item.title}</h3>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {item.type === "movie" && <Film className="h-3 w-3" />}
                                {item.type === "book" && <BookOpen className="h-3 w-3" />}
                                {item.type === "series" && <Tv className="h-3 w-3" />}
                                <span className="capitalize">{item.type}</span>
                                <span>•</span>
                                <span>{item.year}</span>
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              Added: {new Date(item.dateAdded).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="watchlist" className="mt-0">
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                      {mockWatchlist.map((item) => (
                        <div key={item.id} className="flex gap-3 p-2 border rounded-lg">
                          <div className="w-16 h-24 relative overflow-hidden rounded">
                            <img
                              src={item.coverImage || "/placeholder.svg"}
                              alt={item.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium line-clamp-1">{item.title}</h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {item.type === "movie" && <Film className="h-3 w-3" />}
                              {item.type === "book" && <BookOpen className="h-3 w-3" />}
                              {item.type === "series" && <Tv className="h-3 w-3" />}
                              <span className="capitalize">{item.type}</span>
                              <span>•</span>
                              <span>{item.year}</span>
                            </div>
                            <div className="mt-2">
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <ListChecks className="h-3 w-3 mr-1" />
                                Mark as Watched
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
