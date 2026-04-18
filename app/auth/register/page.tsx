"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  };

  if (done) return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.icon}>✉</div>
        <h2 style={styles.title}>Revisa tu correo</h2>
        <p style={styles.sub}>Te hemos enviado un enlace de verificación a <strong>{email}</strong>. Confirma tu cuenta para acceder.</p>
        <Link href="/auth/login" style={styles.linkBtn}>Ir a inicio de sesión</Link>
      </div>
    </div>
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>EduStream</div>
        <h1 style={styles.title}>Crear cuenta</h1>
        <p style={styles.sub}>Empieza a organizar tu biblioteca personal</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={styles.input}
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p style={styles.footer}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" style={styles.link}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#0a0a0f", padding: "24px",
  },
  card: {
    width: "100%", maxWidth: 420, background: "#111118",
    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16,
    padding: "40px 36px", display: "flex", flexDirection: "column", gap: 12,
  },
  logo: {
    fontFamily: "'Syne', sans-serif", fontSize: "1.1rem",
    fontWeight: 800, color: "#e8ff47", letterSpacing: "-0.02em", marginBottom: 4,
  },
  icon: { fontSize: "2.5rem", textAlign: "center" as const, marginBottom: 4 },
  title: {
    fontFamily: "'Syne', sans-serif", fontSize: "1.6rem",
    fontWeight: 700, color: "#f0f0f0", lineHeight: 1.2, marginBottom: 2,
  },
  sub: { fontSize: "0.875rem", color: "#6b6b80", lineHeight: 1.6 },
  form: { display: "flex", flexDirection: "column", gap: 16, marginTop: 8 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "#a0a0b0", letterSpacing: "0.04em" },
  input: {
    background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, padding: "11px 14px", color: "#f0f0f0",
    fontSize: "0.9rem", outline: "none", fontFamily: "inherit",
  },
  error: { fontSize: "0.82rem", color: "#ff5c5c", marginTop: -4 },
  btn: {
    background: "#e8ff47", color: "#0a0a0f", border: "none",
    borderRadius: 8, padding: "12px 20px", fontWeight: 700,
    fontSize: "0.95rem", cursor: "pointer", fontFamily: "'Syne', sans-serif",
    marginTop: 4,
  },
  footer: { fontSize: "0.82rem", color: "#6b6b80", textAlign: "center" as const, marginTop: 4 },
  link: { color: "#e8ff47", textDecoration: "none", fontWeight: 600 },
  linkBtn: {
    display: "block", textAlign: "center" as const, marginTop: 16,
    background: "#e8ff47", color: "#0a0a0f", borderRadius: 8,
    padding: "11px 20px", fontWeight: 700, textDecoration: "none",
    fontFamily: "'Syne', sans-serif", fontSize: "0.9rem",
  },
};
