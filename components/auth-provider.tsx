"use client"

import { AuthProvider as FirebaseAuthProvider } from "@/lib/authContext"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
}