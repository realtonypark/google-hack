// types/gemini.ts

export type UserMediaLog = {
    title: string
    type: "movie" | "tv" | "book"
    rating: number
    tag?: string
    review?: string
    releaseYear?: string // ✅ 실제 DB에서 releaseDate가 "2021-03-15" 형식이면 여기에 잘라서 들어가야 해!
  }