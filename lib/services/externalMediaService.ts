import { MediaItem } from '@/types/database';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const TMDB_API = 'https://api.themoviedb.org/3';

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
    };
  }>;
}

interface TMDBResponse {
  results: Array<{
    id: number;
    title: string;
    overview: string;
    release_date?: string;
    poster_path?: string;
    genre_ids: number[];
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
    title: item.volumeInfo.title,
    description: item.volumeInfo.description || '',
    genres: item.volumeInfo.categories || [],
    releaseDate: item.volumeInfo.publishedDate,
    authors: item.volumeInfo.authors,
    coverImage: item.volumeInfo.imageLinks?.thumbnail,
    rating: 0,
    totalRatings: 0,
    externalId: item.id
  }));
};

export const searchMovies = async (query: string): Promise<MediaItem[]> => {
  const response = await fetch(
    `${TMDB_API}/search/movie?query=${encodeURIComponent(query)}&api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
  );
  const data: TMDBResponse = await response.json();

  return data.results.map(item => ({
    id: item.id.toString(),
    type: 'movie',
    title: item.title,
    description: item.overview,
    genres: item.genre_ids.map(String),
    releaseDate: item.release_date,
    coverImage: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
    rating: 0,
    totalRatings: 0,
    externalId: item.id.toString()
  }));
};

export const searchTVShows = async (query: string): Promise<MediaItem[]> => {
  const response = await fetch(
    `${TMDB_API}/search/tv?query=${encodeURIComponent(query)}&api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
  );
  const data: TMDBResponse = await response.json();

  return data.results.map(item => ({
    id: item.id.toString(),
    type: 'tv',
    title: item.title,
    description: item.overview,
    genres: item.genre_ids.map(String),
    releaseDate: item.release_date,
    coverImage: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
    rating: 0,
    totalRatings: 0,
    externalId: item.id.toString()
  }));
}; 