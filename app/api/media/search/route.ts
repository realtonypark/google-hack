import { NextRequest, NextResponse } from 'next/server';
import { searchBooks } from '@/lib/services/externalMediaService';
import { MediaItem } from '@/types/database';
import { db } from '@/lib/firebase/firebase';
import { doc, setDoc, collection, query as firestoreQuery, where, getDocs } from 'firebase/firestore';
import { removeUndefinedFields } from "@/lib/utils"

const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

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

async function searchMovies(query: string): Promise<MediaItem[]> {
  if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
    throw new Error('TMDB API key is not configured');
  }
  
  const response = await fetch(
    `${TMDB_API}/search/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
  );
  
  if (!response.ok) {
    throw new Error(`TMDB API request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.results) {
    throw new Error('Invalid response format from TMDB API');
  }

  return data.results.map((movie: any) => ({
    id: movie.id.toString(),
    type: 'movie',
    title: movie.title,
    description: movie.overview,
    releaseDate: movie.release_date,
    genres: movie.genre_ids.map((id: number) => genreMap[id] || '').filter(Boolean),
    coverImage: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster+Available',
    externalId: movie.id.toString(),
    rating: movie.vote_average,
    totalRatings: movie.vote_count,
    stats: {
      totalRatings: movie.vote_count,
      averageRating: movie.vote_average / 2,
      ratingDistribution: {}
    }
  }));
}

async function searchTVShows(query: string): Promise<MediaItem[]> {
  if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
    throw new Error('TMDB API key is not configured');
  }
  
  const response = await fetch(
    `${TMDB_API}/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
  );
  
  if (!response.ok) {
    throw new Error(`TMDB API request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.results) {
    throw new Error('Invalid response format from TMDB API');
  }

  return data.results.map((show: any) => ({
    id: show.id.toString(),
    type: 'tv',
    title: show.name,
    description: show.overview,
    releaseDate: show.first_air_date,
    genres: show.genre_ids.map((id: number) => genreMap[id] || '').filter(Boolean),
    coverImage: show.poster_path ? `${TMDB_IMAGE_BASE}${show.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster+Available',
    externalId: show.id.toString(),
    rating: show.vote_average,
    totalRatings: show.vote_count,
    stats: {
      totalRatings: show.vote_count,
      averageRating: show.vote_average / 2,
      ratingDistribution: {}
    }
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const searchQuery = searchParams.get('q');
  const type = searchParams.get('type');

  if (!searchQuery) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // First try to find in our media collection
    const mediaCollection = collection(db, 'media');
    const queryText = searchQuery.toLowerCase();
    
    // Search by title
    const titleQuery = firestoreQuery(
      mediaCollection,
      where('title', '>=', queryText),
      where('title', '<=', queryText + '\uf8ff')
    );
    
    const titleSnapshot = await getDocs(titleQuery);
    const existingResults = titleSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id
      } as MediaItem;
    });

    if (existingResults.length > 0) {
      return NextResponse.json(existingResults);
    }

    // If not found in our database, search external APIs
    let results: MediaItem[] = [];

    switch (type) {
      case 'movie':
        results = await searchMovies(searchQuery);
        break;
      case 'tv':
        results = await searchTVShows(searchQuery);
        break;
      case 'book':
        results = await searchBooks(searchQuery);
        break;
      default:
        // If no type specified, search all
        const [movies, tvShows, books] = await Promise.all([
          searchMovies(searchQuery),
          searchTVShows(searchQuery),
          searchBooks(searchQuery)
        ]);
        results = [...movies, ...tvShows, ...books];
    }

    // Save all results to our media collection
    await Promise.all(results.map(async (item: MediaItem) => {
      const mediaRef = doc(db, 'media', item.id);
      await setDoc(mediaRef, {
        ...removeUndefinedFields(item),
        updatedAt: new Date()
      }, { merge: true });
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search media' },
      { status: 500 }
    );
  }
} 