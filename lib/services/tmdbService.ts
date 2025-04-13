import { MediaItem } from '@/types/database';

const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  genre_ids: number[];
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
}

interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  genre_ids: number[];
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
}

interface TMDBSearchResponse {
  results: (TMDBMovie | TMDBTVShow)[];
  total_results: number;
  total_pages: number;
}

// TMDB genre IDs to genre names mapping
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
  // TV Genres
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

export const searchMovies = async (query: string): Promise<MediaItem[]> => {
  const response = await fetch(
    `${TMDB_API}/search/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data: TMDBSearchResponse = await response.json();

  return data.results.map((movie) => {
    const typedMovie = movie as TMDBMovie;
    return {
      id: typedMovie.id.toString(),
      type: 'movie',
      title: typedMovie.title,
      description: typedMovie.overview,
      releaseDate: typedMovie.release_date,
      genres: typedMovie.genre_ids.map(id => genreMap[id] || '').filter(Boolean),
      coverImage: typedMovie.poster_path ? `${TMDB_IMAGE_BASE}${typedMovie.poster_path}` : undefined,
      externalId: typedMovie.id.toString(),
      stats: {
        totalRatings: typedMovie.vote_count,
        averageRating: typedMovie.vote_average / 2, // Convert from 10-point to 5-point scale
        ratingDistribution: {} // TMDB doesn't provide detailed rating distribution
      }
    };
  });
};

export const searchTVShows = async (query: string): Promise<MediaItem[]> => {
  const response = await fetch(
    `${TMDB_API}/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data: TMDBSearchResponse = await response.json();

  return data.results.map((show) => {
    const typedShow = show as TMDBTVShow;
    return {
      id: typedShow.id.toString(),
      type: 'tv',
      title: typedShow.name,
      description: typedShow.overview,
      releaseDate: typedShow.first_air_date,
      genres: typedShow.genre_ids.map(id => genreMap[id] || '').filter(Boolean),
      coverImage: typedShow.poster_path ? `${TMDB_IMAGE_BASE}${typedShow.poster_path}` : undefined,
      externalId: typedShow.id.toString(),
      stats: {
        totalRatings: typedShow.vote_count,
        averageRating: typedShow.vote_average / 2, // Convert from 10-point to 5-point scale
        ratingDistribution: {} // TMDB doesn't provide detailed rating distribution
      }
    };
  });
}; 