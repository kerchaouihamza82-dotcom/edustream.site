import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import EmbedClient from "./EmbedClient";
import { verifyEmbedToken } from "@/lib/embedToken";

export const dynamic = "force-dynamic";

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  // --- Token validation ---
  if (!token) {
    return <h1>No autorizado</h1>;
  }

  const payload = verifyEmbedToken(token);
  if (!payload) {
    return <h1>No autorizado</h1>;
  }

  // --- Domain validation via Referer / Origin headers ---
  const reqHeaders = await headers();
  const referer = reqHeaders.get("referer") ?? "";
  const origin  = reqHeaders.get("origin")  ?? "";
  const source  = referer || origin;

  const domainInSource = source.includes(payload.domain);
  if (!domainInSource) {
    return <h1>No autorizado</h1>;
  }

  // --- Load video from Supabase ---
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
