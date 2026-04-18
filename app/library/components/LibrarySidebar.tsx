"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LibrarySidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const email = user?.email ?? "";
  const initial = email[0]?.toUpperCase() ?? "U";

  return (
    <aside style={{
      width: 240, flexShrink: 0, background: "#0d0d14",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      padding: "0 0 24px", position: "sticky", top: 0, height: "100vh", overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/library" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#e8ff47", letterSpacing: "-0.02em" }}>
            EduStream
          </span>
        </Link>
        <p style={{ fontSize: "0.7rem", color: "#6b6b80", marginTop: 2, fontWeight: 500 }}>Biblioteca personal</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        <NavItem href="/library" label="Inicio" icon={IconHome} active={pathname === "/library"} />
        <NavItem href="/library/catalogs" label="Mis catálogos" icon={IconCatalog} active={pathname.startsWith("/library/catalogs")} />
      </nav>

      {/* User */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: "#e8ff47",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.85rem", color: "#0a0a0f", flexShrink: 0,
          }}>{initial}</div>
          <span style={{ fontSize: "0.78rem", color: "#a0a0b0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email}
          </span>
        </div>
        <button onClick={handleLogout} style={{
          width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "7px 12px", color: "#6b6b80", fontSize: "0.78rem",
          cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
        }}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: any; active: boolean }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
      borderRadius: 8, textDecoration: "none", marginBottom: 2,
      background: active ? "rgba(232,255,71,0.08)" : "transparent",
      color: active ? "#e8ff47" : "#6b6b80",
      fontSize: "0.875rem", fontWeight: active ? 600 : 400,
      transition: "all .15s",
    }}>
      <Icon size={16} />
      {label}
    </Link>
  );
}

function IconHome({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconCatalog({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
