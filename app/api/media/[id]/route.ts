import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { MediaItem } from '@/types/database';

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

async function fetchFromTMDB(type: string, id: string): Promise<MediaItem | null> {
  if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
    throw new Error('TMDB API key is not configured');
  }

  try {
    let response;
    if (type === 'movie') {
      response = await fetch(
        `${TMDB_API}/movie/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
      );
    } else if (type === 'tv') {
      response = await fetch(
        `${TMDB_API}/tv/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
      );
    } else {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const mediaItem: MediaItem = {
      id: data.id.toString(),
      type: type as 'movie' | 'tv',
      title: type === 'movie' ? data.title : data.name,
      description: data.overview,
      releaseDate: type === 'movie' ? data.release_date : data.first_air_date,
      genres: data.genres.map((genre: any) => genre.name),
      coverImage: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster+Available',
      externalId: data.id.toString(),
      rating: data.vote_average,
      totalRatings: data.vote_count,
      stats: {
        totalRatings: data.vote_count,
        averageRating: data.vote_average / 2,
        ratingDistribution: {}
      }
    };

    // Save to Firestore for future use
    const collection = type === 'movie' ? 'movies' : 'tvshows';
    const mediaRef = doc(db, collection, mediaItem.id);
    await setDoc(mediaRef, {
      ...mediaItem,
      updatedAt: new Date()
    }, { merge: true });

    return mediaItem;
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // Check if the ID has a prefix (e.g., movie-123)
    const hasPrefix = id.includes('-');
    let type = 'media';
    let actualId = id;
    
    if (hasPrefix) {
      [type, actualId] = id.split('-');
    }
    
    // Try to get from the media collection
    const mediaRef = doc(db, 'media', actualId);
    const mediaDoc = await getDoc(mediaRef);
    
    if (mediaDoc.exists()) {
      const mediaData = mediaDoc.data();
      return NextResponse.json({
        ...mediaData,
        id: mediaDoc.id
      });
    }
    
    // If not found, return 404
    return NextResponse.json(
      { error: 'Media not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
} 