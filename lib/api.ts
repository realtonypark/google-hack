// This file contains API functions for interacting with the backend

import { addMediaEntry, updateFavoriteMedia } from '@/lib/firebase/firestore';
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

  // Extract media type from mediaId (format: type-id)
  const [type, id] = mediaData.mediaId.split('-');
  if (!type || !id) {
    throw new Error('Invalid media ID format');
  }

  // If title or coverImage is missing, fetch media details
  if (!mediaData.title || !mediaData.coverImage) {
    const response = await fetch(`/api/media/${mediaData.mediaId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch media details');
    }
    const mediaDetails = await response.json();
    mediaData.title = mediaData.title || mediaDetails.title;
    mediaData.coverImage = mediaData.coverImage || mediaDetails.coverImage;
  }

  const mediaType = type as MediaType;
  
  // Create the entry data
  const entry: Omit<MediaEntry, 'createdAt' | 'updatedAt'> = {
    rating: mediaData.rating || 0,
    tag: mediaData.tags,
    review: mediaData.notes,
    watchedAt: mediaData.date || new Date(), // Use provided date or current date
    title: mediaData.title || '', // Store title for easy reference
    coverImage: mediaData.coverImage || '', // Store cover image for easy reference
    mediaId: id,
    type: mediaType
  };

  console.log('Adding media entry:', entry); // Add logging

  // Add the entry to the user's library
  const entryId = await addMediaEntry(user.uid, mediaType, id, entry);

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
export async function getUserProfile(username: string) {
  // In a real app, this would fetch from Firestore
  return {
    id: "1",
    name: "John Doe",
    username: username,
    image: "/placeholder.svg?height=128&width=128",
    following: 42,
    followers: 128,
  }
}
