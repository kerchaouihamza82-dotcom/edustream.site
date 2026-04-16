import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WatchClient from "./WatchClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select("title, description, youtube_id")
    .eq("id", id)
    .single();

  const title = data?.title ?? "EduStream";
  const description = data?.description ?? "Video educativo en EduStream";
  const thumbnail = data?.youtube_id
    ? `https://img.youtube.com/vi/${data.youtube_id}/maxresdefault.jpg`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://edustream.site/watch/${id}`,
      siteName: "EduStream",
      type: "video.other",
      ...(thumbnail ? { images: [{ url: thumbnail, width: 1280, height: 720, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(thumbnail ? { images: [thumbnail] } : {}),
    },
  };
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: video } = await supabase
    .from("videos")
    .select("id, title, description, youtube_id, slug")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!video) notFound();

  return (
    <WatchClient
      ytId={video.youtube_id}
      title={video.title}
      description={video.description ?? ""}
    />
  );
}
