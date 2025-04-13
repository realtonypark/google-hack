import { Timestamp } from "firebase/firestore"

// Media type enum
export type MediaType = "movie" | "tv" | "book"

// === User Types ===

// Unified user type for app-level use (e.g. auth context)
export interface AppUser {
  id: string // same as Firebase uid
  email: string
  displayName: string
  photoURL?: string
  preferences: {
    genres: string[]
    languages: string[]
  }
  createdAt: Date
  lastActive: Date
}

// Firestore-stored user profile document
export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: Date
  updatedAt: Date
  favoriteMedia?: {
    movie?: {
      mediaId: string
      title: string
      coverImage: string
    }
    tv?: {
      mediaId: string
      title: string
      coverImage: string
    }
    book?: {
      mediaId: string
      title: string
      coverImage: string
    }
  }
  stats?: {
    totalRatings: number
    averageRating: number
    ratingDistribution: {
      [key: string]: number // "4.0": 3, "5.0": 7, ...
    }
  }
}

// === Media Types ===

// Firestore media collection items (books, movies, etc.)
export interface MediaItem {
  id: string
  type: MediaType
  title: string
  description?: string
  coverImage?: string
  releaseDate?: string
  genres?: string[]
  externalId?: string // TMDB ID, Google Books ID, etc.
  stats?: MediaStats
}

// Stats for a media item (aggregated from ratings)
export interface MediaStats {
  totalRatings: number
  averageRating: number
  ratingDistribution: {
    [key: string]: number // "1.0", "4.5", etc.
  }
}

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  description?: string;
  coverImage?: string;
  releaseDate?: string;
  genres?: string[];
  externalId?: string;
  stats?: MediaStats;
  rating?: number;
  totalRatings?: number;
  authors?: string[];
  directors?: string[];
  cast?: string[];
}

export interface UserReview {
  id: string
  userId: string
  mediaId: string
  rating: number
  review: string
  createdAt: Date
  updatedAt: Date
}

// Optional: precomputed recommendations for a user
export interface Recommendation {
  id: string
  userId: string
  mediaId: string
  type: "similar" | "broaden"
  reason: string
  score: number
  createdAt: Date
  viewed: boolean
}