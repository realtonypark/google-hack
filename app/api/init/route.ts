import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MediaItem, User } from '@/types/database';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = getFirestore();

const exampleMedia: MediaItem[] = [
  {
    id: 'movie-1',
    type: 'movie',
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    releaseDate: '2010-07-16',
    directors: ['Christopher Nolan'],
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page'],
    coverImage: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    rating: 8.8,
    totalRatings: 1000,
    externalId: '27205'
  },
  {
    id: 'book-1',
    type: 'book',
    title: 'The Great Gatsby',
    description: 'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
    genres: ['Classic', 'Fiction', 'Romance'],
    releaseDate: '1925-04-10',
    authors: ['F. Scott Fitzgerald'],
    coverImage: 'https://books.google.com/books/content?id=iXn5U2IzVhUC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
    rating: 8.5,
    totalRatings: 800,
    externalId: '4671'
  }
];

const exampleUser: User = {
  id: 'user-1',
  email: 'example@example.com',
  displayName: 'Example User',
  preferences: {
    genres: ['Action', 'Sci-Fi', 'Classic'],
    languages: ['English']
  },
  createdAt: new Date(),
  lastActive: new Date()
};

export async function POST() {
  try {
    const batch = adminDb.batch();
    
    // Initialize collections with example data
    const collections = {
      users: [exampleUser],
      media: exampleMedia,
      reviews: [],
      recommendations: []
    };

    for (const [collectionName, items] of Object.entries(collections)) {
      const colRef = adminDb.collection(collectionName);
      
      // Add example items
      items.forEach(item => {
        const docRef = colRef.doc(item.id);
        batch.set(docRef, item);
      });
    }

    // Commit the batch
    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
} 