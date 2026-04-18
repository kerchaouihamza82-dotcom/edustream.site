"use server";

import { cookies } from "next/headers";

const VALID_EMAIL = "kerchaouihamza82@gmail.com";
const VALID_PASSWORD = "123456789K";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (email === VALID_EMAIL && password === VALID_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("edustream_auth", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false,
      sameSite: "lax",
    });
    return { ok: true };
  }

  return { error: "Email o contraseña incorrectos." };
}
