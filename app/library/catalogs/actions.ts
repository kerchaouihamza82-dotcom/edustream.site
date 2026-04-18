"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCatalog(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const name      = (formData.get("name") as string)?.trim();
  const parentId  = formData.get("parent_id") as string | null;
  if (!name) return { error: "El nombre es obligatorio" };

  const { error } = await supabase.from("catalogs").insert({
    name,
    user_id: user.id,
    parent_id: parentId || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/library/catalogs");
  return { ok: true };
}

export async function deleteCatalog(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("catalogs").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/library/catalogs");
  return { ok: true };
}

export async function createLink(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const title      = (formData.get("title") as string)?.trim();
  const url        = (formData.get("url") as string)?.trim();
  const catalog_id = formData.get("catalog_id") as string;
  if (!title || !url || !catalog_id) return { error: "Todos los campos son obligatorios" };

  const { error } = await supabase.from("catalog_links").insert({
    title, url, catalog_id, user_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/library/catalogs");
  return { ok: true };
}

export async function deleteLink(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("catalog_links").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/library/catalogs");
  return { ok: true };
}
