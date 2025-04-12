// app/login/page.tsx
import { redirect } from "next/navigation"
import LoginForm from "@/components/login-form"
import { cookies } from "next/headers"
import { adminAuth } from "@/lib/firebase-admin"

export default async function LoginPage() {
  try {
    // Check if user is already logged in
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value
    
    if (sessionCookie) {
      // Verify the session cookie
      try {
        await adminAuth.verifySessionCookie(sessionCookie, true)
        // User is logged in, redirect to home
        redirect("/")
      } catch (error) {
        // Invalid session cookie, continue to login page
      }
    }
  } catch (error) {
    // Error checking session, continue to login page
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to MediaMatch</h1>
          <p className="text-sm text-muted-foreground">Discover media based on your unique taste</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}