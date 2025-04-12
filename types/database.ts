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

export interface MediaItem {
  id: string;
  type: 'movie' | 'tv' | 'book';
  title: string;
  description: string;
  genres: string[];
  releaseDate?: string;
  authors?: string[];
  directors?: string[];
  cast?: string[];
  coverImage?: string;
  rating: number;
  totalRatings: number;
  externalId: string; // For Google Books API or TMDB
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