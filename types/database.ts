import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferences: {
    genres: string[];
    languages: string[];
  };
  createdAt: Date;
  lastActive: Date;
}

export type MediaType = 'movie' | 'tv' | 'book';

export interface MediaEntry {
  rating: number;
  tag?: string;
  review?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  watchedAt: Date | Timestamp;
  title: string;
  coverImage: string;
  mediaId: string;
  type: MediaType;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  favoriteMedia?: {
    movie?: {
      mediaId: string;
      title: string;
      coverImage: string;
    };
    tv?: {
      mediaId: string;
      title: string;
      coverImage: string;
    };
    book?: {
      mediaId: string;
      title: string;
      coverImage: string;
    };
  };
  stats?: {
    totalRatings: number;
    averageRating: number;
    ratingDistribution: {
      [key: string]: number; // "0.5" to "5.0"
    };
  };
}

export interface MediaStats {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: {
    [key: string]: number; // "0.5" to "5.0"
  };
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
  year?: string;
  isFeatured?: boolean
  isNew?: boolean 
}

export interface UserReview {
  id: string;
  userId: string;
  mediaId: string;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recommendation {
  id: string;
  userId: string;
  mediaId: string;
  type: 'similar' | 'broaden';
  reason: string;
  score: number;
  createdAt: Date;
  viewed: boolean;
} 