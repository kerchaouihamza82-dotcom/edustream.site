import jwt from "jsonwebtoken";

const SECRET = process.env.EMBED_SECRET!;

export interface EmbedTokenPayload {
  videoId: string;
  domain?: string; // optional — if absent, no domain restriction applies
}

/** Generate a signed JWT embed token valid for 1 hour.
 *  domain is optional. If omitted, the embed works on any domain. */
export function generateEmbedToken(videoId: string, domain?: string): string {
  const payload: EmbedTokenPayload = { videoId };
  if (domain) payload.domain = domain;
  return jwt.sign(payload, SECRET, { expiresIn: "1h" });
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
