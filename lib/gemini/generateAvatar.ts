import { GoogleGenAI, Modality } from "@google/genai";
import { MediaEntry } from "@/types/database";
import { getAvatarTemplate } from "@/lib/firebase/firestore";

const genAI = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function generateAvatarImage(
  entries: MediaEntry[],
  evolutionStage: number
): Promise<string> {
  const imageUrl = await getAvatarTemplate(evolutionStage); // URL 받기
  console.log("🧬 Avatar generation started");
  console.log("Evolution Stage:", evolutionStage);
  console.log("Base image URL:", imageUrl);
  console.log("User media sample:", entries.slice(0, 5));
  const imageRes = await fetch(imageUrl);
  const imageBuffer = await imageRes.arrayBuffer();
  const baseImageBase64 = arrayBufferToBase64(imageBuffer); // base64 변환

  const prompt = `
  You are an AI artist specializing in personalized avatars.
  
  Your task is to take the provided **base avatar template** (used as structure and silhouette only),
  and generate a new version that visually reflects the **user's media preferences**.
  
  ### Instructions:
  - Do **NOT** change the overall body shape or silhouette — use the base image as the foundation.
  - Add **details** based on the user's taste: color palette, facial expression, mood, accessories, and subtle visual motifs.
  - These details should reference common **themes, tones, and aesthetics** from the user's most-rated or most-reviewed media.
  - Avoid text, logos, or background. The style must remain minimalist, vector-like, and "kawaii"-inspired.
  
  ### User media data (summarized):
  ${JSON.stringify(entries.slice(0, 20), null, 2)}
  
  ### Final goal:
  Output a **single customized avatar image**, still aligned with the structure of the base image, but expressive of the user's personal taste profile.
  `;

  const result = await genAI.models.generateContent({
    model: "gemini-2.0-flash-exp-image-generation",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: baseImageBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const parts = result.candidates?.[0]?.content?.parts;

  if (!parts) throw new Error("No content returned");

  const imageBase64 = parts.find((part) => part.inlineData)?.inlineData?.data;

  if (!imageBase64) {
    throw new Error("Failed to generate avatar image");
  }

  return imageBase64;
}