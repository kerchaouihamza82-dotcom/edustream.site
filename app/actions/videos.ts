"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Clean a domain string: remove protocol, www, trailing slash */
function cleanDomain(raw: string): string {
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();
}

export async function addVideoAction(data: {
  ytId: string;
  title?: string;
  category?: string;
  domain?: string;
}) {
  const admin = getAdmin();

  const domain = data.domain ? cleanDomain(data.domain) : undefined;

  const { data: video, error } = await admin
    .from("videos")
    .insert({
      youtube_id: data.ytId,
      title: data.title || null,
      slug: data.category || null,
      description: data.category || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, id: null, embedToken: null };

  const { generateEmbedToken } = await import("@/lib/embedToken");
  const embedToken = generateEmbedToken(video.id, domain);

  return { error: null, id: video.id as string, embedToken };
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
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, videos: [] };
  return { error: null, videos: data };
}
