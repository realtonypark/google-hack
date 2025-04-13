// components/login-form.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { signInWithGoogle } from "@/lib/firebase/firebase"
import { useRouter } from "next/navigation"


export default function LoginForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  const loginWithGoogle = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      router.push("/")
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Button variant="outline" type="button" disabled={isLoading} onClick={loginWithGoogle}>
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Sign in with Google
      </Button>
    </div>
  )
}