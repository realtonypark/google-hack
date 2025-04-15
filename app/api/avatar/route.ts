import { NextRequest, NextResponse } from "next/server";
import { getUserMediaEntries, saveUserAvatar } from "@/lib/firebase/firestore";
import { generateAvatarImage } from "@/lib/gemini/generateAvatar";
import { saveUserAvatarToStorage } from "@/lib/firebase/storage/saveUserAvatarToStorage";

export async function POST(req: NextRequest) {
  try {
    const { userId, evolutionStage } = await req.json();

    if (!userId || evolutionStage === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const entries = await getUserMediaEntries(userId);
    const imageBase64 = await generateAvatarImage(entries, evolutionStage);

    // ✅ Firebase Storage에 업로드 (기존 이미지 삭제 포함)
    const imageUrl = await saveUserAvatarToStorage(userId, imageBase64);

    // ✅ Firestore에 URL만 저장
    await saveUserAvatar(userId, imageUrl);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Avatar generation error:", error);
    return NextResponse.json({ error: "Failed to generate avatar" }, { status: 500 });
  }
}