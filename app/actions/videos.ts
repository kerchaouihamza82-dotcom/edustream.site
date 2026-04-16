"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function addVideoAction(data: {
  ytId: string;
  title: string;
  category: string;
}) {
  const admin = getAdmin();
  const { data: video, error } = await admin
    .from("videos")
    .insert({
      youtube_id: data.ytId,
      title: data.title,
      slug: data.category,
      description: data.category,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, id: null };
  return { error: null, id: video.id as string };
}

export async function deleteVideoAction(id: string) {
  const admin = getAdmin();
  const { error } = await admin.from("videos").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function listVideosAction() {
  const admin = getAdmin();
  const { data, error } = await admin
    .from("videos")
    .select("id, title, slug, youtube_id, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, videos: [] };
  return { error: null, videos: data };
}
