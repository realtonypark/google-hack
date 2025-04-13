import { initializeApp, getApp, getApps } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { signOut as firebaseSignOut } from 'firebase/auth'
import { removeUndefinedFields } from "@/lib/utils"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// ✅ 중복 초기화 방지
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

// ✅ Google 로그인 + 세션 생성
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const idToken = await result.user.getIdToken(true)
    await createSession(idToken)
    await new Promise(resolve => setTimeout(resolve, 2000))
    await saveUserToFirestore(result.user)
    return result.user
  } catch (error) {
    console.error("Google sign-in failed:", error)
    throw error
  }
}

const createSession = async (idToken: string) => {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })

  if (!response.ok) throw new Error('Failed to create session')
}

export const saveUserToFirestore = async (user: User) => {
  if (!user.uid) return

  const userData = removeUndefinedFields({
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || null,
    createdAt: new Date(),
    isAuthenticated: true,
  })

  const userRef = doc(db, 'users', user.uid)
  await setDoc(userRef, userData, { merge: true })
}

export const signOut = async () => {
  await firebaseSignOut(auth)
  await fetch('/api/auth/session', { method: 'DELETE' })
}