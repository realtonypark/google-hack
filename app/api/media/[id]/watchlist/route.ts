import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/firebase';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { add } = await request.json();
    
    // Get the auth token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get the media type from Firestore
    const mediaRef = doc(db, 'media', id);
    const mediaDoc = await getDoc(mediaRef);
    
    if (!mediaDoc.exists()) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    const mediaData = mediaDoc.data();
    const mediaType = mediaData.type || 'movie';
    const fullMediaId = `${mediaType}-${id}`;

    // Get the user's document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        watchlist: add ? [fullMediaId] : [],
        updatedAt: new Date()
      });
    } else {
      // Update watchlist with the full media ID
      await updateDoc(userRef, {
        watchlist: add ? arrayUnion(fullMediaId) : arrayRemove(fullMediaId),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to update watchlist' },
      { status: 500 }
    );
  }
} 