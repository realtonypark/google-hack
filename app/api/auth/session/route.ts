// app/api/auth/session/route.ts
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    
    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    
    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
    
    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set('session', '', {
    expires: new Date(0),
    path: '/',
  })
  
  return NextResponse.json({ status: 'success' })
}