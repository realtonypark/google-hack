import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { MediaItem, UserReview, Recommendation } from '@/types/database';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export const getMediaRecommendations = async (userId: string): Promise<Recommendation[]> => {
  // Get user's reviews and preferences
  const reviewsRef = collection(db, 'reviews');
  const q = query(reviewsRef, where('userId', '==', userId));
  const reviewsSnapshot = await getDocs(q);
  const reviews = reviewsSnapshot.docs.map(doc => doc.data() as UserReview);

  // Get user's preferences
  const userDoc = await getDocs(collection(db, 'users'));
  const user = userDoc.docs.find(doc => doc.id === userId)?.data();

  // Prepare context for Gemini
  const context = {
    reviews,
    preferences: user?.preferences,
  };

  // Generate recommendations using Gemini
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = `Based on the following user data, generate 5 recommendations:
  - Similar content they might like
  - Content to broaden their horizons
  User data: ${JSON.stringify(context)}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const recommendations = JSON.parse(response.text());

  // Store recommendations in Firestore
  const recommendationsRef = collection(db, 'recommendations');
  const storedRecs = await Promise.all(
    recommendations.map((rec: any) => 
      addDoc(recommendationsRef, {
        userId,
        mediaId: rec.mediaId,
        type: rec.type,
        reason: rec.reason,
        score: rec.score,
        createdAt: new Date(),
        viewed: false
      })
    )
  );

  return storedRecs;
};

export const addMediaReview = async (review: Omit<UserReview, 'id' | 'createdAt' | 'updatedAt'>) => {
  const reviewsRef = collection(db, 'reviews');
  const newReview = {
    ...review,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await addDoc(reviewsRef, newReview);
};

export const updateMediaRating = async (mediaId: string, rating: number) => {
  const mediaRef = doc(db, 'media', mediaId);
  await updateDoc(mediaRef, {
    rating,
    totalRatings: increment(1)
  });
}; 