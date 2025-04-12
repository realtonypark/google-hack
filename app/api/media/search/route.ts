import { NextResponse } from 'next/server';
import { searchBooks, searchMovies, searchTVShows } from '@/lib/services/externalMediaService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    let results;
    switch (type) {
      case 'book':
        results = await searchBooks(query);
        break;
      case 'movie':
        results = await searchMovies(query);
        break;
      case 'tv':
        results = await searchTVShows(query);
        break;
      default:
        // Search all types
        const [books, movies, tvShows] = await Promise.all([
          searchBooks(query),
          searchMovies(query),
          searchTVShows(query)
        ]);
        results = [...books, ...movies, ...tvShows];
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