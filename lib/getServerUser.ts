// lib/getServerUser.ts
import { cookies } from 'next/headers'
import { adminAuth } from './firebase-admin'

export async function getServerUser() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value
    
    if (!sessionCookie) {
      return null
    }
    
    // Verify the session cookie and get the user
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    const user = await adminAuth.getUser(decodedClaims.uid)
    
    return {
      id: user.uid,
      name: user.displayName,
      email: user.email,
      image: user.photoURL,
      username: user.displayName?.toLowerCase().replace(/\s+/g, "") || user.uid
    }
  } catch (error) {
    // Invalid session cookie
    return null
  }
}