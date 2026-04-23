import jwt from "jsonwebtoken";

const SECRET = process.env.EMBED_SECRET!;

export interface EmbedTokenPayload {
  videoId: string;
  domain: string;
}

/** Generate a signed JWT embed token valid for 1 hour */
export function generateEmbedToken(videoId: string, domain: string): string {
  return jwt.sign({ videoId, domain }, SECRET, { expiresIn: "1h" });
}

/** Verify and decode an embed token. Returns null if invalid or expired. */
export function verifyEmbedToken(token: string): EmbedTokenPayload | null {
  try {
    const payload = jwt.verify(token, SECRET) as EmbedTokenPayload;
    return payload;
  } catch {
    return null;
  }
}
