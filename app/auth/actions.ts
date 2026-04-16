"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@app.local`;
}

export async function signIn(username: string, password: string) {
  const supabase = await createClient();
  const email = usernameToEmail(username);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (
      error.message.includes("Invalid login credentials") ||
      error.message.includes("invalid_credentials")
    ) {
      return { error: "Credenciales incorrectas. Verifica tu usuario y contraseña." };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function signUp(username: string, password: string) {
  const supabase = await createClient();
  const email = usernameToEmail(username);
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";

  // 1. Check username already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    return { error: "Este nombre de usuario ya está en uso." };
  }

  // 2. Check IP registration limit (max 3)
  const { data: reg } = await supabase
    .from("registrations")
    .select("count")
    .eq("ip_address", ip)
    .maybeSingle();

  if (reg && reg.count >= 3) {
    return { error: "Has alcanzado el límite de 3 cuentas por IP." };
  }

  // 3. Register the user (email confirmation disabled in Supabase dashboard)
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username.trim().toLowerCase() },
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        undefined,
    },
  });

  if (signUpError) {
    if (signUpError.message.includes("already registered")) {
      return { error: "Este nombre de usuario ya está en uso." };
    }
    return { error: signUpError.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }

  // 4. Insert / upsert profile (trigger also does this, but be explicit)
  await supabase
    .from("profiles")
    .upsert({ id: userId, username: username.trim().toLowerCase() });

  // 5. Upsert IP registration count
  if (reg) {
    await supabase
      .from("registrations")
      .update({ count: reg.count + 1 })
      .eq("ip_address", ip);
  } else {
    await supabase
      .from("registrations")
      .insert({ ip_address: ip, count: 1 });
  }

  return { error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
