import { getStorage, ref, uploadString, deleteObject, getDownloadURL } from "firebase/storage";

export async function saveUserAvatarToStorage(userId: string, base64Image: string): Promise<string> {
  const storage = getStorage();

  const avatarRef = ref(storage, `avatars/${userId}.png`);

  // 기존 이미지 삭제 시도 (있을 경우)
  try {
    await deleteObject(avatarRef);
    console.log("🗑️ Previous avatar deleted");
  } catch (err) {
    console.warn("No previous avatar to delete or error during deletion:", err);
  }

  // 새 이미지 업로드
  await uploadString(avatarRef, base64Image, 'base64');
  console.log("✅ New avatar uploaded");

  // public URL 리턴
  const url = await getDownloadURL(avatarRef);
  return url;
}