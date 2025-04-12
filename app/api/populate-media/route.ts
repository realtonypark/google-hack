import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Validate environment variables
const requiredEnvVars = {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  NEXT_PUBLIC_TMDB_API_KEY: process.env.NEXT_PUBLIC_TMDB_API_KEY
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

const adminDb = getFirestore();
const TMDB_API = 'https://api.themoviedb.org/3';

async function testTMDBConnection() {
  try {
    console.log('Testing TMDB API connection...');
    const response = await fetch(
      `${TMDB_API}/configuration?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TMDB API test failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log('TMDB API connection successful:', data);
    return true;
  } catch (error) {
    console.error('TMDB API test failed:', error);
    throw error;
  }
}

async function fetchTVShows() {
  try {
    // Verify TMDB API key
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) {
      throw new Error('TMDB API key is missing');
    }
    console.log('TMDB API key is present');

    // Test API connection first
    await testTMDBConnection();
    
    let allShows: any[] = [];
    const totalPages = 30; // Fetch 30 pages (20 shows per page = 600 shows)
    
    for (let page = 1; page <= totalPages; page++) {
      try {
        console.log(`\nFetching TV shows page ${page}/${totalPages}...`);
        const url = `${TMDB_API}/tv/popular?api_key=${apiKey}&language=en-US&page=${page}`;
        console.log('Request URL:', url);
        
        const response = await fetch(url);
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(`Failed to fetch page ${page}: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Response received:', {
          page: data.page,
          totalPages: data.total_pages,
          totalResults: data.total_results,
          resultsCount: data.results?.length
        });
        
        if (!data.results || !Array.isArray(data.results)) {
          console.error('Invalid response format:', data);
          throw new Error(`Invalid response format: missing results array`);
        }
        
        const validShows = data.results.filter((show: any) => {
          const isValid = show.id && show.name && show.overview;
          if (!isValid) {
            console.warn('Invalid show data:', {
              id: show.id,
              name: show.name,
              hasOverview: !!show.overview
            });
          }
          return isValid;
        });
        
        console.log(`Found ${validShows.length} valid TV shows for page ${page}`);
        allShows.push(...validShows);
        
        // Increased delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        // Continue to next page even if current page fails
        continue;
      }
    }
    
    if (allShows.length === 0) {
      throw new Error('No TV shows were successfully fetched');
    }
    
    console.log(`\nTotal TV shows fetched: ${allShows.length}`);
    return allShows;
  } catch (error) {
    console.error('\nError in fetchTVShows:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

export async function POST() {
  try {
    console.log('\n=== Starting TV Show Population Process ===\n');
    
    // Verify Firebase connection
    try {
      const testQuery = await adminDb.collection('media').limit(1).get();
      console.log('Firebase connection verified');
      console.log('Existing documents:', testQuery.size);
    } catch (error) {
      console.error('Failed to verify Firebase connection:', error);
      if (error instanceof Error) {
        console.error('Firebase error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw new Error('Failed to connect to Firebase');
    }

    // Fetch TV shows
    const shows = await fetchTVShows();
    console.log(`\nProcessing ${shows.length} TV shows for storage...`);

    // Store TV shows in Firebase in smaller batches
    let validShows = 0;
    let currentBatch = adminDb.batch();
    let operationsInCurrentBatch = 0;
    const mediaRef = adminDb.collection('media');
    const BATCH_SIZE = 20; // Reduced batch size for better quota management
    const BATCH_DELAY = 1500; // 1.5 second delay between batches

    for (let i = 0; i < shows.length; i++) {
      const show = shows[i];
      try {
        if (!show.id || !show.name || !show.overview) {
          console.warn('Skipping invalid TV show:', {
            id: show.id,
            name: show.name,
            hasOverview: !!show.overview
          });
          continue;
        }

        // Create new batch if current one is full
        if (operationsInCurrentBatch >= BATCH_SIZE) {
          console.log(`Committing batch ${Math.floor(i / BATCH_SIZE) + 1} with ${operationsInCurrentBatch} operations...`);
          try {
            await currentBatch.commit();
            console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} committed successfully`);
            console.log(`Progress: ${validShows}/${shows.length} shows processed (${Math.round((validShows/shows.length)*100)}%)`);
            
            // Add delay between batch commits
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
          } catch (error) {
            console.error('Error committing batch:', error);
            if (error instanceof Error) {
              console.error('Batch error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
              });
            }
            throw error;
          }
          currentBatch = adminDb.batch();
          operationsInCurrentBatch = 0;
        }
        
        const docRef = mediaRef.doc(`tv-${show.id}`);
        currentBatch.set(docRef, {
          id: `tv-${show.id}`,
          type: 'tv',
          title: show.name,
          description: show.overview,
          genres: show.genre_ids.map(String),
          releaseDate: show.first_air_date,
          coverImage: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
          rating: show.vote_average,
          totalRatings: show.vote_count,
          externalId: show.id.toString(),
          popularity: show.popularity,
          originalLanguage: show.original_language,
          originalTitle: show.original_name,
          numberOfSeasons: show.number_of_seasons,
          numberOfEpisodes: show.number_of_episodes,
          status: show.status
        });
        operationsInCurrentBatch++;
        validShows++;
      } catch (error) {
        console.error('Error processing TV show:', error);
        console.error('Problematic TV show data:', JSON.stringify(show, null, 2));
        if (error instanceof Error) {
          console.error('Processing error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        // Continue with next show even if current one fails
        continue;
      }
    }

    if (validShows === 0) {
      throw new Error('No valid TV shows to store in Firebase');
    }

    // Commit any remaining TV shows in the last batch
    if (operationsInCurrentBatch > 0) {
      console.log(`Committing final batch with ${operationsInCurrentBatch} operations...`);
      try {
        await currentBatch.commit();
        console.log('Final batch committed successfully');
      } catch (error) {
        console.error('Error committing final batch:', error);
        if (error instanceof Error) {
          console.error('Final batch error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        throw error;
      }
    }

    console.log(`\nSuccessfully stored ${validShows} TV shows in Firebase`);

    return NextResponse.json({ 
      success: true,
      count: {
        tvShows: validShows
      }
    });
  } catch (error) {
    console.error('\nError in POST:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { 
        error: 'Failed to populate media database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}