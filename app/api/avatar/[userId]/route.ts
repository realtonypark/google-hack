import { NextRequest, NextResponse } from "next/server";
import { getUserAvatar } from "@/lib/firebase/firestore";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = await params;
    const image = await getUserAvatar(userId);
    return NextResponse.json({ image });
  } catch (error) {
    console.error("Failed to fetch avatar:", error);
    return NextResponse.json({ image: null });
  }
}