import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    // Get the user's document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        watchlist: add ? [id] : [],
        updatedAt: new Date()
      });
    } else {
      // Update watchlist
      await updateDoc(userRef, {
        watchlist: add ? arrayUnion(id) : arrayRemove(id),
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