// lib/gemini/matcher.ts

import { ParsedRecommendation } from "./parsers"
import { MediaItem } from "@/types/database"
import { db } from "@/lib/firebase/firebase"
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  CollectionReference,
} from "firebase/firestore"

/**
 * Queries Firestore for media items that match parsed Gemini recommendations.
 * Uses a more flexible matching approach to find results even when exact matches aren't found.
 * Limits the total recommendations to a reasonable number.
 */
export async function matchRecommendationsFromFirestore(
  parsed: ParsedRecommendation[]
): Promise<MediaItem[]> {
  console.log("🔍 Matching recommendations to Firestore:", parsed);
  
  if (parsed.length === 0) {
    console.warn("⚠️ No recommendations to match");
    return [];
  }

  // Keep track of processed IDs to avoid duplicates
  const processedIds = new Set<string>();
  const results: MediaItem[] = [];
  const mediaRef = collection(db, "media");
  
  // Maximum recommendations to return
  const MAX_RECOMMENDATIONS = 10;
  
  // Process each recommendation until we reach our limit
  for (const rec of parsed) {
    // Stop if we've reached our maximum number of recommendations
    if (results.length >= MAX_RECOMMENDATIONS) {
      console.log(`✅ Reached maximum of ${MAX_RECOMMENDATIONS} recommendations`);
      break;
    }
    
    console.log(`📚 Looking for match for "${rec.title}" (${rec.year || 'any year'})`);
    
    try {
      // First try with exact title match
      const exactQuery = query(
        mediaRef,
        where("title", "==", rec.title),
        limit(1)
      );
      
      let snapshot = await getDocs(exactQuery);
      let foundMatch = false;
      
      // Check for exact match
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const id = doc.id;
        
        // Only add if we haven't processed this ID yet
        if (!processedIds.has(id)) {
          processedIds.add(id);
          
          const data = doc.data();
          console.log(`✅ Found exact match for "${rec.title}": "${data.title}"`);
          
          results.push(createMediaItemFromDoc(doc, data, rec));
          foundMatch = true;
        }
      }
      
      // If no exact match or we've already processed this ID, try partial match
      if (!foundMatch) {
        console.log(`🔄 Trying partial match for "${rec.title}"`);
        
        // Get a limited set of media items
        const allMediaQuery = query(mediaRef, limit(50));
        const allMedia = await getDocs(allMediaQuery);
        
        // Find media with similar title
        for (const doc of allMedia.docs) {
          const id = doc.id;
          
          // Skip if we've already processed this ID
          if (processedIds.has(id)) continue;
          
          const data = doc.data();
          const title = data.title || '';
          
          // Check for meaningful partial match - title must be at least 4 chars
          // and partial match must be significant (at least 40% of length)
          if (
            rec.title.length >= 4 && 
            (
              title.toLowerCase().includes(rec.title.toLowerCase()) ||
              (rec.title.toLowerCase().includes(title.toLowerCase()) && title.length >= 5)
            )
          ) {
            processedIds.add(id);
            console.log(`✅ Found partial match for "${rec.title}": "${title}"`);
            
            results.push(createMediaItemFromDoc(doc, data, rec));
            foundMatch = true;
            break;  // Only take the first partial match
          }
        }
      }
      
      // If still no match, try year-based match if year is available
      if (!foundMatch && rec.year) {
        console.log(`🔄 Trying year-based search for ${rec.year}`);
        
        const yearStart = `${rec.year}-01-01`;
        const yearEnd = `${rec.year}-12-31`;
        
        const yearQuery = query(
          mediaRef,
          where("releaseDate", ">=", yearStart),
          where("releaseDate", "<=", yearEnd),
          limit(1)
        );
        
        snapshot = await getDocs(yearQuery);
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const id = doc.id;
          
          // Only add if we haven't processed this ID yet
          if (!processedIds.has(id)) {
            processedIds.add(id);
            
            const data = doc.data();
            console.log(`✅ Found year match for "${rec.title}" (${rec.year}): "${data.title}"`);
            
            results.push(createMediaItemFromDoc(doc, data, rec));
            foundMatch = true;
          }
        }
      }
      
      // If still no match, create a placeholder
      if (!foundMatch) {
        console.warn(`❌ No matches found for "${rec.title}" (${rec.year || 'any year'})`);
        
        // Create unique ID for placeholder
        const placeholderId = `placeholder-${rec.title.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        if (!processedIds.has(placeholderId)) {
          processedIds.add(placeholderId);
          results.push(createPlaceholderMediaItem(rec, placeholderId, 'placeholder'));
        }
      }
    } catch (error) {
      console.error(`Error matching "${rec.title}":`, error);
      
      // Create unique ID for error placeholder
      const errorId = `error-${rec.title.replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      if (!processedIds.has(errorId)) {
        processedIds.add(errorId);
        results.push(createPlaceholderMediaItem(rec, errorId, 'error'));
      }
    }
  }

  console.log(`🎬 Returning ${results.length} recommendations`);
  return results;
}

// Helper function to create a MediaItem from a Firestore document
function createMediaItemFromDoc(
  doc: QueryDocumentSnapshot<DocumentData>, 
  data: DocumentData, 
  rec: ParsedRecommendation
): MediaItem {
  return {
    id: doc.id,
    title: data.title || rec.title,
    type: data.type || "movie",
    coverImage: data.coverImage || "/placeholder.svg",
    year: data.releaseDate?.substring(0, 4) || rec.year || "Unknown",
    genres: data.genres || [],
    description: data.description || `Recommended based on your interests.`,
    isFeatured: data.isFeatured || false,
    isNew: data.isNew || false
  } as MediaItem;
}

// Helper function to create a placeholder MediaItem
function createPlaceholderMediaItem(
  rec: ParsedRecommendation, 
  id: string, 
  prefix: string
): MediaItem {
  return {
    id: id,
    title: rec.title,
    type: "movie", // Default type
    coverImage: "/placeholder.jpg",
    year: rec.year || "Unknown",
    genres: ["Recommended"],
    description: prefix === 'error' 
      ? "Error finding this recommendation." 
      : "This recommended title was not found in our database.",
    isFeatured: false,
    isNew: false
  } as MediaItem;
}