// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth'
import { signOut as firebaseSignOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Helper function for Google sign-in
export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google sign-in process");
    
    // Perform Google authentication
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google auth successful, user:", result.user.uid);
    
    // Get the ID token immediately
    const idToken = await result.user.getIdToken(true);
    console.log("Got fresh ID token");
    
    // Create session first
    try {
      await createSession(idToken);
      console.log("Session created successfully");
    } catch (sessionError) {
      console.error("Session creation error:", sessionError);
    }
    
    // Add a delay to allow auth state to propagate
    console.log("Waiting for auth state to propagate...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to write to Firestore after delay
    try {
      await saveUserToFirestore(result.user);
    } catch (firestoreError) {
      console.error("Firestore save error (after delay):", firestoreError);
    }
    
    return result.user;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    throw error;
  }
}

const createSession = async (idToken: string) => {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create session')
  }
}

export const saveUserToFirestore = async (user: User) => {
  if (!user.uid) return;

  try {
    console.log("Saving user with UID:", user.uid);
    
    // Use a simpler user structure that matches both formats
    const userData = {
      uid: user.uid, // This is critical for your security rules
      email: user.email || null,
      displayName: user.displayName || user.email?.split('@')[0] || "User",
      photoURL: user.photoURL || null,
      createdAt: new Date(),
      // Add an isAuthenticated field to make rules easier
      isAuthenticated: true
    };
    
    // Use set with merge to avoid overwriting any existing data
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, userData, { merge: true });
    
    console.log("User saved successfully");
    return true;
  } catch (error) {
    console.error("Firestore save error:", error.message, error.code);
    // Log the full error for debugging
    console.error("Full error:", error);
    return false;
  }
};

export const signOut = async () => {
  try {
    // First sign out from Firebase
    await firebaseSignOut(auth)
    
    // Then delete the session cookie
    await fetch('/api/auth/session', {
      method: 'DELETE',
    })
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}