// This file contains API functions for interacting with the backend

// Get recommendations based on type
// lib/api.ts

import { addMediaEntry, updateFavoriteMedia } from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/firebase';
import { MediaEntry, MediaType } from '@/types/database';
import { getRecommendations as realGetRecommendations } from "@/lib/recommendations/getRecommendations"
import { MediaEntryInput} from '@/types/database'

export async function getRecommendations(type: string, userId: string) {
  return realGetRecommendations(type as "personal" | "broaden", userId)
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
  const entry: MediaEntryInput = {
    userId: user.uid,
    rating: mediaData.rating || 0,
    tag: mediaData.tags,
    review: mediaData.notes,
    watchedAt: mediaData.date || new Date(),
    title: mediaData.title || '',
    coverImage: mediaData.coverImage || '',
    mediaId: id,
    type: mediaType,
  };

  console.log('Adding media entry:', entry); // Add logging

  // Add the entry to the user's library
  const entryId = await addMediaEntry(user.uid, mediaType, id, entry)
  
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
  const entry: MediaEntryInput = {
    userId: user.uid,
    rating: 0,
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
