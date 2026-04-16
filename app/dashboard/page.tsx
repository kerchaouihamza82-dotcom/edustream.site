import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const username =
    user.user_metadata?.username ??
    user.email?.replace("@app.local", "") ??
    "Usuario";

  // Load videos
  const { data: videos } = await supabase
    .from("videos")
    .select("id, youtube_id, title, description, created_at, slug, views")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Load links count
  const { count: linksCount } = await supabase
    .from("links")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <DashboardClient
      username={username}
      videos={videos ?? []}
      linksCount={linksCount ?? 0}
    />
  );
}
