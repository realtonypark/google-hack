import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    const mediaRef = doc(db, 'media', id);
    const mediaDoc = await getDoc(mediaRef);
    
    if (!mediaDoc.exists()) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }
    
    const mediaData = mediaDoc.data();
    return NextResponse.json({
      ...mediaData,
      id: mediaDoc.id
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
} 