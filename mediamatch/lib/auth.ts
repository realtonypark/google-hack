import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { cert } from "firebase-admin/app"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: process.env.FIREBASE_PROJECT_ID ? FirestoreAdapter({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  }) : undefined,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token, user }: any) {
      if (session.user) {
        // Use token.sub as fallback for user ID
        session.user.id = user?.id || token?.sub || "unknown-id";
        
        // Generate username from name or fallback to ID
        const userName = session.user.name || '';
        session.user.username = 
          user?.username || 
          (typeof userName === 'string' ? userName.toLowerCase().replace(/\s+/g, "") : "") || 
          session.user.id;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
}