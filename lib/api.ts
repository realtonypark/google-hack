// This file contains API functions for interacting with the backend

import { addMediaEntry, updateFavoriteMedia, getUserProfile as getUserProfileFromFirestore } from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/firebase';
import { MediaEntry, MediaType } from '@/types/database';

// Get recommendations based on type
export async function getRecommendations(type: string) {
  // In a real app, this would be a fetch to your API
  // For demo purposes, we'll return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([])
    }, 500)
  })
}

// Search for media by title and type
export async function searchMedia(query: string, type: string) {
  // In a real app, this would search Google Books API or similar
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([])
    }, 500)
  })
}

// Add media to user's library
export async function addMediaToLibrary(mediaData: {
  mediaId: string;
  date?: Date;
  tags?: string;
  notes?: string;
  rating?: number;
  title?: string;
  coverImage?: string;
}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be logged in to add media to library');
  }

  // Try to fetch media details, but don't throw if not found
  let mediaDetails = null;
  try {
    const response = await fetch(`/api/media/${mediaData.mediaId}`);
    if (response.ok) {
      mediaDetails = await response.json();
    }
  } catch (error) {
    console.log('Could not fetch media details:', error);
  }
  
  // Use fetched details if available, otherwise use provided data
  const title = mediaData.title || mediaDetails?.title || 'Unknown Title';
  const coverImage = mediaData.coverImage || mediaDetails?.coverImage || 'https://via.placeholder.com/500x750?text=No+Image+Available';
  const type = mediaDetails?.type || 'media' as MediaType;

  // Create the entry data
  const entry: Omit<MediaEntry, 'createdAt' | 'updatedAt'> = {
    rating: mediaData.rating || 0,
    tag: mediaData.tags,
    review: mediaData.notes,
    watchedAt: mediaData.date || new Date(),
    title: title,
    coverImage: coverImage,
    mediaId: mediaData.mediaId,
    type: type
  };

  console.log('Adding media entry:', entry);

  // Add the entry to the user's library
  const entryId = await addMediaEntry(user.uid, type, mediaData.mediaId, entry);

  // Remove from watchlist if it exists there
  try {
    const token = await user.getIdToken();
    await fetch(`/api/media/${mediaData.mediaId}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ add: false }),
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    // Don't throw error here as the main operation (adding to library) succeeded
  }

  return entryId;
}

// Add media to library from recommendation
export async function addToLibrary(mediaId: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be logged in to add media to library');
  }

  // Extract media type from mediaId (format: type-id)
  const [type, id] = mediaId.split('-');
  if (!type || !id) {
    throw new Error('Invalid media ID format');
  }

  // Fetch media details first
  const response = await fetch(`/api/media/${mediaId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch media details');
  }
  const mediaDetails = await response.json();

  const mediaType = type as MediaType;
  const entry: Omit<MediaEntry, 'createdAt' | 'updatedAt'> = {
    rating: 0, // Default rating
    watchedAt: new Date(),
    title: mediaDetails.title || '',
    coverImage: mediaDetails.coverImage || '',
    mediaId: id,
    type: mediaType
  };

  return addMediaEntry(user.uid, mediaType, id, entry);
}

// Get user profile data
export async function getUserProfile(uid: string): Promise<any> {
  try {
    // Get the user document from Firestore using the UID
    const userDoc = await getUserProfileFromFirestore(uid);
    
    if (!userDoc) {
      return null;
    }

    // Transform the data to match the expected format
    return {
      id: userDoc.uid,
      name: userDoc.displayName,
      username: userDoc.displayName?.toLowerCase().replace(/\s+/g, "") || userDoc.uid,
      image: userDoc.photoURL || "/placeholder.svg?height=128&width=128",
      following: 0, // TODO: Implement following/followers functionality
      followers: 0,
      stats: userDoc.stats || {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: {}
      },
      favoriteMedia: userDoc.favoriteMedia || {
        movie: null,
        tv: null,
        book: null
      }
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}