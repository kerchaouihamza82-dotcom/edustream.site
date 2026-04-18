import { createClient } from "@/lib/supabase/server";
import CatalogsClient from "./CatalogsClient";

export default async function CatalogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: catalogs }, { data: links }] = await Promise.all([
    supabase.from("catalogs").select("*").eq("user_id", user!.id).order("created_at", { ascending: true }),
    supabase.from("catalog_links").select("*").eq("user_id", user!.id).order("created_at", { ascending: true }),
  ]);

  return <CatalogsClient catalogs={catalogs ?? []} links={links ?? []} />;
}
