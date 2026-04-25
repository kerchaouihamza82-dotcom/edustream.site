import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { verifyEmbedToken } from "@/lib/embedToken";
import EmbedClient from "./EmbedClient";

export const dynamic = "force-dynamic";

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; t?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  // If a token is present, validate it. If invalid or expired → reject.
  // If no token is present → allow freely (normal embed from academy iframe).
  if (token) {
    const payload = await verifyEmbedToken(token);
    if (!payload) {
      return (
        <html>
          <body style={{ background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", margin: 0, fontFamily: "sans-serif" }}>
            <p>Este enlace ha expirado.</p>
          </body>
        </html>
      );
    }
  }

  // Load video from Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: video } = await supabase
    .from("videos")
    .select("id, youtube_id, title")
    .eq("id", id)
    .single();

  if (!video) notFound();

  return <EmbedClient ytId={video.youtube_id} title={video.title} embedId={id} />;
}
