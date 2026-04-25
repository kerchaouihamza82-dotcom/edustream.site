import { NextRequest, NextResponse } from "next/server";
import { generateShortToken } from "@/lib/embedToken";

// This endpoint generates a short-lived (15 min) signed token for iOS Safari navigation.
// The EMBED_SECRET never leaves the server.
export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  try {
    const token = await generateShortToken(videoId);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
