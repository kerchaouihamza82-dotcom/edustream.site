import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EmbedClient from "./EmbedClient";

export const dynamic = "force-dynamic";

export default async function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: video } = await supabase
    .from("videos")
    .select("id, youtube_id, title")
    .eq("id", id)
    .single();

  if (!video) notFound();

  return <EmbedClient ytId={video.youtube_id} title={video.title} />;
}
