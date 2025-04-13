// lib/api.ts

import {
  addMediaEntry,
  updateFavoriteMedia,
  getUserProfile as getUserProfileFromFirestore,
} from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/firebase';
import { MediaEntry, MediaType } from '@/types/database';
import { getRecommendations as realGetRecommendations } from '@/lib/recommendations/getRecommendations';

// ✅ Gemini 기반 추천 함수
export async function getRecommendations(type: string, userId: string) {
  return realGetRecommendations(type as 'personal' | 'broaden', userId);
}

// 🔍 검색 기능 (현재는 mock)
export async function searchMedia(query: string, type: string) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 500);
  });
}

// ➕ 라이브러리에 미디어 추가
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
  if (!user) throw new Error('User must be logged in to add media to library');

  let mediaDetails = null;
  try {
    const response = await fetch(`/api/media/${mediaData.mediaId}`);
    if (response.ok) {
      mediaDetails = await response.json();
    }
  } catch (error) {
    console.log('Could not fetch media details:', error);
  }

  const title = mediaData.title || mediaDetails?.title || 'Unknown Title';
  const coverImage =
    mediaData.coverImage ||
    mediaDetails?.coverImage ||
    'https://via.placeholder.com/500x750?text=No+Image+Available';
  const type = mediaDetails?.type || ('media' as MediaType);

  const entry: Omit<MediaEntry, 'createdAt' | 'updatedAt'> = {
    rating: mediaData.rating || 0,
    tag: mediaData.tags,
    review: mediaData.notes,
    watchedAt: mediaData.date || new Date(),
    title,
    coverImage,
    mediaId: mediaData.mediaId,
    type,
  };

  const entryId = await addMediaEntry(user.uid, type, mediaData.mediaId, entry);

  try {
    const token = await user.getIdToken();
    await fetch(`/api/media/${mediaData.mediaId}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ add: false }),
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
  }

  return entryId;
}

// 추천에서 바로 추가
export async function addToLibrary(mediaId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be logged in to add media to library');

  const [type, id] = mediaId.split('-');
  if (!type || !id) throw new Error('Invalid media ID format');

  const response = await fetch(`/api/media/${mediaId}`);
  if (!response.ok) throw new Error('Failed to fetch media details');

  const mediaDetails = await response.json();

  const mediaType = type as MediaType;
  const entry: Omit<MediaEntry, 'createdAt' | 'updatedAt'> = {
    rating: 0,
    watchedAt: new Date(),
    title: mediaDetails.title || '',
    coverImage: mediaDetails.coverImage || '',
    mediaId: id,
    type: mediaType,
  };

  return addMediaEntry(user.uid, mediaType, id, entry);
}

// 👤 사용자 프로필 불러오기
export async function getUserProfile(uid: string): Promise<any> {
  try {
    const userDoc = await getUserProfileFromFirestore(uid);
    if (!userDoc) return null;

    return {
      id: userDoc.uid,
      name: userDoc.displayName,
      username:
        userDoc.displayName?.toLowerCase().replace(/\s+/g, '') || userDoc.uid,
      image: userDoc.photoURL || '/placeholder.svg?height=128&width=128',
      following: 0,
      followers: 0,
      stats: userDoc.stats || {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: {},
      },
      favoriteMedia: userDoc.favoriteMedia || {
        movie: null,
        tv: null,
        book: null,
      },
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}