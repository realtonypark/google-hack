import { NextResponse } from 'next/server';
import { searchMedia, searchByGenre } from '@/lib/services/searchService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const typeParam = searchParams.get('type');
    const type = typeParam as 'book' | 'movie' | 'series' | undefined;
    const genre = searchParams.get('genre');
    const maxResults = Number(searchParams.get('limit')) || 10;

    if (!query && !genre) {
      return NextResponse.json(
        { error: 'Either query or genre parameter is required' },
        { status: 400 }
      );
    }

    let results;
    if (genre) {
      results = await searchByGenre(genre, type, maxResults);
    } else if (query) {
      results = await searchMedia(query, type, maxResults);
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