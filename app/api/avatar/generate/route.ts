import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binary);
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, imageUrl } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-pro-vision",
    });

    const imageRes = await fetch(imageUrl);
    const imageBuffer = await imageRes.arrayBuffer();
    const imageBase64 = arrayBufferToBase64(imageBuffer);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/png",
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }

    return NextResponse.json({ imageBase64: imagePart.inlineData.data });
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}