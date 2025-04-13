// components/navigation.tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, PlusCircle, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/authContext"
import { signOut } from "@/lib/firebase"

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()

  if (loading) {
    return null // Or a loading spinner
  }

  if (!user && pathname !== "/login") {
    return null
  }

  if (pathname === "/login") {
    return null
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">MediaMatch</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
            <Link href="/add">
              <Button variant="ghost" size="icon">
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Add Media</span>
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user?.uid}`}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  )
}