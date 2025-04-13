// lib/firebase/userLogs.ts
import { db } from "@/lib/firebase/firebase"
import {
  collectionGroup,
  getDocs,
  query,
  where,
} from "firebase/firestore"
import { UserMediaLog } from "@/types/gemini"

export async function getUserMediaLogs(userId: string): Promise<UserMediaLog[]> {
  const q = query(
    collectionGroup(db, "entries"),
    where("userId", "==", userId) // entries 문서 안에 반드시 있어야 함!
  )

  const snapshot = await getDocs(q)

  const logs: UserMediaLog[] = []
  snapshot.forEach((doc) => {
    const data = doc.data()
    logs.push({
      title: data.title,
      type: data.type,
      rating: data.rating,
      tag: data.tag,
      review: data.review,
      releaseYear: data.releaseDate?.split("-")[0],
    })
  })

  return logs
}