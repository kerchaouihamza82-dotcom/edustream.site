import { SignJWT, jwtVerify } from "jose";

const getSecret = () => {
  const s = process.env.EMBED_SECRET;
  if (!s) throw new Error("EMBED_SECRET is not set");
  return new TextEncoder().encode(s);
};

export interface EmbedTokenPayload {
  videoId: string;
  domain?: string;
}

/** Generate a signed token valid for 1 hour (for embed links in dashboard) */
export async function generateEmbedToken(videoId: string, domain?: string): Promise<string> {
  const payload: Record<string, string> = { videoId };
  if (domain) payload.domain = domain;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(await getSecret());
}

/** Generate a short-lived token valid for 15 minutes (for iOS Safari navigation) */
export async function generateShortToken(videoId: string): Promise<string> {
  return new SignJWT({ videoId, short: "1" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(await getSecret());
}

/** Verify and decode a token. Returns null if invalid or expired. */
export async function verifyEmbedToken(token: string): Promise<EmbedTokenPayload | null> {
  try {
    const secret = await getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as EmbedTokenPayload;
  } catch {
    return null;
  }
}
