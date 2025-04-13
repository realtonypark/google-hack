import { db } from '@/lib/firebase/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, addDoc, Timestamp, DocumentReference, DocumentData } from 'firebase/firestore';
import { MediaEntry, MediaType, UserProfile, MediaItem } from '@/types/database';

// User Profile Operations
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export async function createUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  try {
    const userProfile: UserProfile = {
      uid: userId,
      email: data.email || '',
      displayName: data.displayName || '',
      photoURL: data.photoURL,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: {}
      }
    };
    await setDoc(doc(db, 'users', userId), userProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    await updateDoc(doc(db, 'users', userId), updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Media Entry Operations
export async function addMediaEntry(
  userId: string,
  mediaType: MediaType,
  mediaId: string,
  entry: Omit<MediaEntry, 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    console.log('Starting addMediaEntry with:', { userId, mediaType, mediaId, entry });
    
    // First, ensure user document exists
    const userRef = doc(db, 'users', userId);
    console.log('Checking user document at path:', userRef.path);
    
    const userDoc = await getDoc(userRef);
    console.log('User document exists:', userDoc.exists());
    
    if (!userDoc.exists()) {
      console.log('Creating new user profile...');
      await createUserProfile(userId, {});
      console.log('User profile created successfully');
    }

    const entryData: MediaEntry = {
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create library document if it doesn't exist
    const libraryRef = doc(db, 'users', userId, 'library', mediaType);
    console.log('Creating/updating library document at path:', libraryRef.path);
    
    try {
      await setDoc(libraryRef, { 
        type: mediaType,
        updatedAt: new Date() 
      }, { merge: true });
      console.log('Library document created/updated successfully');
    } catch (error) {
      console.error('Error creating library document:', error);
      throw error;
    }
    
    // Add the entry under the entries collection
    const entriesRef = collection(libraryRef, 'entries');
    console.log('Adding entry to collection at path:', entriesRef.path);
    
    let entryRef;
    try {
      const entryDataWithMetadata = {
        ...entryData,
        mediaId,
        type: mediaType
      };
      console.log('Entry data to be added:', entryDataWithMetadata);
      
      entryRef = await addDoc(entriesRef, entryDataWithMetadata);
      console.log('Entry added successfully with ID:', entryRef.id);
    } catch (error) {
      console.error('Error adding entry document:', error);
      throw error;
    }

    // Update user's rating statistics
    if (entry.rating) {
      console.log('Updating user rating stats...');
      try {
        await updateUserRatingStats(userId, entry.rating);
        console.log('User rating stats updated successfully');
      } catch (error) {
        console.error('Error updating user rating stats:', error);
        // Don't throw here, continue with the process
      }
    }
    
    // Update media's rating statistics
    if (entry.rating) {
      console.log('Updating media rating stats...');
      try {
        await updateMediaRatingStats(mediaType, mediaId, entry.rating);
        console.log('Media rating stats updated successfully');
      } catch (error) {
        console.error('Error updating media rating stats:', error);
        // Don't throw here, continue with the process
      }
    }

    return entryRef.id;
  } catch (error) {
    console.error('Error in addMediaEntry:', error);
    throw error;
  }
}

export async function updateMediaEntry(
  userId: string,
  mediaType: MediaType,
  mediaId: string,
  entryId: string,
  oldRating: number,
  entry: Partial<Omit<MediaEntry, 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const updateData = {
      ...entry,
      updatedAt: new Date()
    };
    
    const mediaTypeRef = doc(db, 'users', userId, 'library', mediaType);
    await updateDoc(
      doc(mediaTypeRef, 'entries', entryId),
      updateData
    );

    // If rating was updated, update statistics
    if (entry.rating && entry.rating !== oldRating) {
      await updateUserRatingStats(userId, entry.rating, oldRating);
      await updateMediaRatingStats(mediaType, mediaId, entry.rating, oldRating);
    }
  } catch (error) {
    console.error('Error updating media entry:', error);
    throw error;
  }
}

// Helper functions for updating rating statistics
async function updateUserRatingStats(
  userId: string,
  newRating: number,
  oldRating?: number
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data() as UserProfile;
  
  const stats = userData.stats || {
    totalRatings: 0,
    averageRating: 0,
    ratingDistribution: {}
  };

  // Remove old rating if it exists
  if (oldRating) {
    const oldRatingKey = oldRating.toFixed(1);
    stats.ratingDistribution[oldRatingKey] = (stats.ratingDistribution[oldRatingKey] || 1) - 1;
    if (stats.ratingDistribution[oldRatingKey] <= 0) {
      delete stats.ratingDistribution[oldRatingKey];
    }
  } else {
    stats.totalRatings += 1;
  }

  // Add new rating
  const ratingKey = newRating.toFixed(1);
  stats.ratingDistribution[ratingKey] = (stats.ratingDistribution[ratingKey] || 0) + 1;

  // Calculate new average
  const totalRatings = Object.values(stats.ratingDistribution).reduce((sum, count) => sum + count, 0);
  const weightedSum = Object.entries(stats.ratingDistribution)
    .reduce((sum, [rating, count]) => sum + (parseFloat(rating) * count), 0);
  
  stats.averageRating = weightedSum / totalRatings;
  stats.totalRatings = totalRatings;

  await updateDoc(userRef, { stats });
}

async function updateMediaRatingStats(
  mediaType: MediaType,
  mediaId: string,
  newRating: number,
  oldRating?: number
): Promise<void> {
  const mediaRef = doc(db, 'media', `${mediaType}-${mediaId}`);
  const mediaDoc = await getDoc(mediaRef);
  
  if (!mediaDoc.exists()) {
    // Create new media document if it doesn't exist
    const mediaData: MediaItem = {
      id: mediaId,
      type: mediaType,
      title: '', // This should be set when the media is first added to the database
      stats: {
        totalRatings: 1,
        averageRating: newRating,
        ratingDistribution: {
          [newRating.toFixed(1)]: 1
        }
      }
    };
    await setDoc(mediaRef, mediaData);
    return;
  }

  const mediaData = mediaDoc.data() as MediaItem;
  const stats = mediaData.stats || {
    totalRatings: 0,
    averageRating: 0,
    ratingDistribution: {}
  };

  // Remove old rating if it exists
  if (oldRating) {
    const oldRatingKey = oldRating.toFixed(1);
    stats.ratingDistribution[oldRatingKey] = (stats.ratingDistribution[oldRatingKey] || 1) - 1;
    if (stats.ratingDistribution[oldRatingKey] <= 0) {
      delete stats.ratingDistribution[oldRatingKey];
    }
  } else {
    stats.totalRatings += 1;
  }

  // Add new rating
  const ratingKey = newRating.toFixed(1);
  stats.ratingDistribution[ratingKey] = (stats.ratingDistribution[ratingKey] || 0) + 1;

  // Calculate new average
  const totalRatings = Object.values(stats.ratingDistribution).reduce((sum, count) => sum + count, 0);
  const weightedSum = Object.entries(stats.ratingDistribution)
    .reduce((sum, [rating, count]) => sum + (parseFloat(rating) * count), 0);
  
  stats.averageRating = weightedSum / totalRatings;
  stats.totalRatings = totalRatings;

  await updateDoc(mediaRef, { stats });
}

// Favorite Media Operations
export async function updateFavoriteMedia(
  userId: string,
  mediaType: MediaType,
  mediaData: {
    mediaId: string;
    title: string;
    coverImage: string;
  }
): Promise<void> {
  try {
    const updateData = {
      [`favoriteMedia.${mediaType}`]: mediaData,
      updatedAt: new Date()
    };
    await updateDoc(doc(db, 'users', userId), updateData);
  } catch (error) {
    console.error('Error updating favorite media:', error);
    throw error;
  }
}

// Query Operations
export async function getUserMediaEntries(
  userId: string,
  mediaType?: MediaType
): Promise<Array<{ id: string; mediaId: string; type: MediaType } & MediaEntry>> {
  try {
    console.log('Starting getUserMediaEntries for user:', userId);
    const entries: Array<{ id: string; mediaId: string; type: MediaType } & MediaEntry> = [];
    
    if (mediaType) {
      // Query specific media type
      const entriesRef = collection(db, 'users', userId, 'library', mediaType, 'entries');
      console.log('Querying specific media type:', mediaType, 'at path:', entriesRef.path);
      const entriesSnapshot = await getDocs(entriesRef);
      console.log('Found entries for', mediaType, ':', entriesSnapshot.size);
      
      for (const doc of entriesSnapshot.docs) {
        const entryData = doc.data() as MediaEntry;
        console.log('Processing entry:', entryData);
        entries.push({
          id: doc.id,
          ...entryData,
          mediaId: entryData.mediaId,
          type: mediaType
        });
      }
    } else {
      // Query all media types
      const mediaTypes: MediaType[] = ['movie', 'tv', 'book'];
      console.log('Querying all media types:', mediaTypes);
      
      for (const type of mediaTypes) {
        const entriesRef = collection(db, 'users', userId, 'library', type, 'entries');
        console.log('Querying media type:', type, 'at path:', entriesRef.path);
        const entriesSnapshot = await getDocs(entriesRef);
        console.log('Found entries for', type, ':', entriesSnapshot.size);
        
        for (const doc of entriesSnapshot.docs) {
          const entryData = doc.data() as MediaEntry;
          console.log('Processing entry:', entryData);
          entries.push({
            id: doc.id,
            ...entryData,
            mediaId: entryData.mediaId,
            type
          });
        }
      }
    }

    console.log('Total entries found:', entries.length);
    // Sort entries by watchedAt date in descending order
    entries.sort((a, b) => {
      const dateA = a.watchedAt instanceof Date ? a.watchedAt : a.watchedAt.toDate();
      const dateB = b.watchedAt instanceof Date ? b.watchedAt : b.watchedAt.toDate();
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log('Fetched library entries:', entries);
    return entries;
  } catch (error) {
    console.error('Error fetching user media entries:', error);
    throw error;
  }
}

export async function getUserWatchlist(userId: string): Promise<string[]> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return [];
    }
    return userDoc.data().watchlist || [];
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
}

// Get all users with their favorite media
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const users = usersSnapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    })) as UserProfile[];
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
} 