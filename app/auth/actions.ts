"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    if (
      error.message.includes("Invalid login credentials") ||
      error.message.includes("invalid_credentials")
    ) {
      return { error: "Credenciales incorrectas. Verifica tu email y contraseña." };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "Confirma tu email antes de iniciar sesión." };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient();
  const normalizedEmail = email.trim().toLowerCase();

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";

  // Check IP registration limit (max 3)
  const { data: reg } = await supabase
    .from("registrations")
    .select("count")
    .eq("ip_address", ip)
    .maybeSingle();

  if (reg && reg.count >= 3) {
    return { error: "Has alcanzado el límite de 3 cuentas por IP." };
  }

  // Register the user
  const { data, error: signUpError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        undefined,
    },
  });

  if (signUpError) {
    if (
      signUpError.message.includes("already registered") ||
      signUpError.message.includes("User already registered")
    ) {
      return { error: "Este email ya tiene una cuenta. Inicia sesión." };
    }
    return { error: signUpError.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }

  // Force-confirm the email using the Admin API so the user can log in immediately
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await admin.auth.admin.updateUser(userId, { email_confirm: true });

  // Upsert profile
  await supabase
    .from("profiles")
    .upsert({ id: userId, username: normalizedEmail.split("@")[0] });

  // Track IP registrations
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

  // Sign in immediately after confirmed registration
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (signInError) {
    return { error: "Cuenta creada. Inicia sesión con tu email y contraseña." };
  }

  return { error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
