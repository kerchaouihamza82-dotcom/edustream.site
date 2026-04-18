import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Stats
  const [{ count: catalogCount }, { count: linkCount }] = await Promise.all([
    supabase.from("catalogs").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("catalog_links").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
  ]);

  const email = user?.email ?? "";
  const name  = email.split("@")[0];

  return (
    <div style={{ padding: "40px 40px 60px", maxWidth: 900 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.8rem", fontWeight: 800, color: "#f0f0f0", marginBottom: 6 }}>
        Hola, {name}
      </h1>
      <p style={{ color: "#6b6b80", fontSize: "0.9rem", marginBottom: 40 }}>
        Bienvenido a tu biblioteca personal. Organiza tus catálogos y enlaces.
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 48 }}>
        <StatCard label="Catálogos" value={catalogCount ?? 0} />
        <StatCard label="Enlaces guardados" value={linkCount ?? 0} />
      </div>

      {/* Quick action */}
      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 32 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#f0f0f0", marginBottom: 8 }}>
          Empieza a organizar
        </h2>
        <p style={{ color: "#6b6b80", fontSize: "0.875rem", marginBottom: 20, lineHeight: 1.6 }}>
          Crea catálogos para agrupar tus enlaces. Puedes anidar catálogos dentro de otros para una organización jerárquica.
        </p>
        <Link href="/library/catalogs" style={{
          display: "inline-block", background: "#e8ff47", color: "#0a0a0f",
          borderRadius: 8, padding: "10px 20px", fontWeight: 700,
          fontSize: "0.875rem", textDecoration: "none",
          fontFamily: "'Syne', sans-serif",
        }}>
          Ver mis catálogos
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: "#111118", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "24px 20px",
    }}>
      <div style={{ fontSize: "2rem", fontWeight: 800, color: "#e8ff47", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: "0.8rem", color: "#6b6b80", marginTop: 6, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}
