import { MediaItem } from '@/types/database';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const TMDB_API = 'https://api.themoviedb.org/3';

const genreMap: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

interface GoogleBooksResponse {
  items: Array<{
    id: string;
    volumeInfo: {
      title: string;
      description?: string;
      authors?: string[];
      publishedDate?: string;
      imageLinks?: {
        thumbnail?: string;
      };
      categories?: string[];
      averageRating?: number;       // ✅ 추가
      ratingsCount?: number; 
    };
  }>;
}

export interface TMDBMovieResponse {
  results: Array<{
    id: number;
    title: string; // ✅ 영화 제목
    overview: string;
    release_date?: string;
    poster_path?: string;
    genre_ids: number[];
    vote_average: number;
    vote_count: number;
  }>;
}

interface TMDBTVResponse {
  results: Array<{
    id: number;
    name: string; // ✅ TV 시리즈의 제목
    overview: string;
    first_air_date?: string;
    poster_path?: string;
    genre_ids: number[];
    vote_average: number;
    vote_count: number;
  }>;
}

export const searchBooks = async (query: string): Promise<MediaItem[]> => {
  const response = await fetch(
    `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY}`
  );
  const data: GoogleBooksResponse = await response.json();

  return data.items.map(item => ({
    id: item.id,
    type: 'book',
    year: item.volumeInfo.publishedDate?.substring(0, 4),
    title: item.volumeInfo.title,
    description: item.volumeInfo.description || '',
    genres: item.volumeInfo.categories || [],
    releaseDate: item.volumeInfo.publishedDate,
    authors: item.volumeInfo.authors,
    coverImage: item.volumeInfo.imageLinks?.thumbnail,
    rating: item.volumeInfo.averageRating ?? 0,             
    totalRatings: item.volumeInfo.ratingsCount ?? 0, 
    externalId: item.id
  }));
};

export const searchMovies = async (query: string): Promise<MediaItem[]> => {
  const response = await fetch(
    `${TMDB_API}/search/movie?query=${encodeURIComponent(query)}&api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
  );
  const data: TMDBMovieResponse = await response.json();

  return data.results.map(item => ({
    id: item.id.toString(),
    type: 'movie',
    title: item.title,
    description: item.overview,
    genres: item.genre_ids.map(id => genreMap[id] || 'Unknown'),
    releaseDate: item.release_date,
    year: item.release_date?.substring(0, 4),
    coverImage: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
    rating: item.vote_average,
    totalRatings: item.vote_count,
    externalId: item.id.toString()
  }));
};

export const searchTVShows = async (query: string): Promise<MediaItem[]> => {
  const response = await fetch(
    `${TMDB_API}/search/tv?query=${encodeURIComponent(query)}&api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
  );
  const data: TMDBTVResponse = await response.json();

  return data.results.map(item => ({
    id: item.id.toString(),
    type: 'tv',
    title: item.name, 
    description: item.overview,
    genres: item.genre_ids.map(id => genreMap[id] || 'Unknown'),
    releaseDate: item.first_air_date,
    year: item.first_air_date?.substring(0, 4),
    coverImage: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
    rating: item.vote_average,
    totalRatings: item.vote_count,
    externalId: item.id.toString()
  }));
};