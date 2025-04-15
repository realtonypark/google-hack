import { db } from '../firebase/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { MediaItem } from '@/types/database';

export const searchMedia = async (
  searchQuery: string,
  type?: 'book' | 'movie' | 'series',
  maxResults: number = 10
): Promise<MediaItem[]> => {
  try {
    console.log('Starting search with query:', searchQuery);
    
    // Get all documents from the media collection
    const mediaRef = collection(db, 'media');
    const querySnapshot = await getDocs(mediaRef);
    console.log('Total documents in collection:', querySnapshot.size);

    const results: MediaItem[] = [];
    const searchLower = searchQuery.toLowerCase();

    querySnapshot.forEach((doc) => {
      const data = doc.data() as MediaItem;
      console.log('Checking document:', data.title);
      
      // Check if the title includes the search query (case insensitive)
      if (data.title?.toLowerCase().includes(searchLower)) {
        // If type is specified, only include matching type
        if (!type || data.type === type) {
          results.push({
            ...data,
            id: doc.id
          });
        }
      }
    });

    console.log('Search results:', results);
    
    // Return only up to maxResults
    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

export const searchByGenre = async (
  genre: string,
  type?: 'book' | 'movie' | 'series',
  maxResults: number = 10
): Promise<MediaItem[]> => {
  try {
    console.log('Starting genre search with:', genre);
    
    // Get all documents from the media collection
    const mediaRef = collection(db, 'media');
    const querySnapshot = await getDocs(mediaRef);
    console.log('Total documents in collection:', querySnapshot.size);

    const results: MediaItem[] = [];
    const genreLower = genre.toLowerCase();

    querySnapshot.forEach((doc) => {
      const data = doc.data() as MediaItem;
      console.log('Checking document genres:', data.genres);
      
      // Check if any genre matches (case insensitive)
      if (data.genres?.some(g => g.toLowerCase().includes(genreLower))) {
        // If type is specified, only include matching type
        if (!type || data.type === type) {
          results.push({
            ...data,
            id: doc.id
          });
        }
      }
    });

    console.log('Genre search results:', results);
    
    // Return only up to maxResults
    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Genre search error:', error);
    throw error;
  }
}; 