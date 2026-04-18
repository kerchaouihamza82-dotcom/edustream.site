import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import EmbedClient from "./EmbedClient";

export const dynamic = "force-dynamic";

export default async function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Use service role to bypass RLS — embed is public, no user session
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

  return <EmbedClient ytId={video.youtube_id} title={video.title} />;
}
