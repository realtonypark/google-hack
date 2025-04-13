import { NextRequest, NextResponse } from 'next/server';
import { searchMovies, searchTVShows } from '@/lib/services/tmdbService';
import { searchBooks } from '@/lib/services/externalMediaService';
import { MediaItem } from '@/types/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const type = searchParams.get('type');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    let results: MediaItem[] = [];

    switch (type) {
      case 'movie':
        results = await searchMovies(query);
        // Ensure IDs are prefixed with type
        results = results.map((item: MediaItem) => ({
          ...item,
          id: `movie-${item.id}`
        }));
        break;
      case 'tv':
        results = await searchTVShows(query);
        results = results.map((item: MediaItem) => ({
          ...item,
          id: `tv-${item.id}`
        }));
        break;
      case 'book':
        results = await searchBooks(query);
        results = results.map((item: MediaItem) => ({
          ...item,
          id: `book-${item.id}`
        }));
        break;
      default:
        // If no type specified, search all
        const [movies, tvShows, books] = await Promise.all([
          searchMovies(query),
          searchTVShows(query),
          searchBooks(query)
        ]);
        
        results = [
          ...movies.map((item: MediaItem) => ({ ...item, id: `movie-${item.id}` })),
          ...tvShows.map((item: MediaItem) => ({ ...item, id: `tv-${item.id}` })),
          ...books.map((item: MediaItem) => ({ ...item, id: `book-${item.id}` }))
        ];
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search media' },
      { status: 500 }
    );
  }
} 