"use client";

import { useState, useTransition } from "react";
import { createCatalog, deleteCatalog, createLink, deleteLink } from "./actions";

type Catalog = { id: string; name: string; parent_id: string | null; created_at: string };
type Link    = { id: string; title: string; url: string; catalog_id: string; created_at: string };

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function CatalogsClient({ catalogs, links }: { catalogs: Catalog[]; links: Link[] }) {
  const [openCatalogId, setOpenCatalogId] = useState<string | null>(null);
  const [showNewCat, setShowNewCat]       = useState(false);
  const [showNewLink, setShowNewLink]     = useState(false);
  const [isPending, startTransition]      = useTransition();

  const openCatalog = catalogs.find(c => c.id === openCatalogId);
  const catalogLinks = links.filter(l => l.catalog_id === openCatalogId);

  const handleCreateCatalog = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createCatalog(fd);
      setShowNewCat(false);
    });
    (e.currentTarget as HTMLFormElement).reset();
  };

  const handleCreateLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("catalog_id", openCatalogId!);
    startTransition(async () => {
      await createLink(fd);
      setShowNewLink(false);
    });
    (e.currentTarget as HTMLFormElement).reset();
  };

  // --- Inside a catalog ---
  if (openCatalog) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", padding: "32px 28px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button onClick={() => { setOpenCatalogId(null); setShowNewLink(false); }} style={backBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Mis catálogos
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={heading}>{openCatalog.name}</h1>
            <p style={sub}>{catalogLinks.length} enlace{catalogLinks.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowNewLink(v => !v)} style={primaryBtn}>
            {showNewLink ? "Cancelar" : "+ Añadir enlace"}
          </button>
        </div>

        {/* New link form */}
        {showNewLink && (
          <form onSubmit={handleCreateLink} style={card}>
            <p style={{ fontSize: "0.8rem", color: "#a0a0b0", marginBottom: 12 }}>
              Pega el enlace de YouTube y asígnale un título.
            </p>
            <input name="title" required placeholder="Título del video" style={input} />
            <input name="url" type="url" required placeholder="https://youtube.com/watch?v=..." style={{ ...input, marginTop: 8 }} />
            <button type="submit" disabled={isPending} style={{ ...primaryBtn, marginTop: 12, width: "100%" }}>
              {isPending ? "Guardando..." : "Guardar enlace"}
            </button>
          </form>
        )}

        {/* Links list */}
        {catalogLinks.length === 0 && !showNewLink && (
          <div style={{ color: "#6b6b80", fontSize: "0.875rem", paddingTop: 16 }}>
            No hay enlaces en este catálogo. Pulsa &quot;+ Añadir enlace&quot; para empezar.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginTop: 8 }}>
          {catalogLinks.map(link => {
            const ytId = extractYouTubeId(link.url);
            return (
              <div key={link.id} style={card}>
                {ytId && (
                  <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 12, aspectRatio: "16/9" }}>
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                      alt={link.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f0f0f0", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {link.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "0.72rem", color: "#6b6b80", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {link.url}
                  </a>
                  <button onClick={() => startTransition(async () => { await deleteLink(link.id); })}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ff5c5c", padding: 2, flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Catalog list view ---
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", padding: "32px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={heading}>Mi biblioteca</h1>
          <p style={sub}>{catalogs.length} catálogo{catalogs.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowNewCat(v => !v)} style={primaryBtn}>
          {showNewCat ? "Cancelar" : "+ Nuevo catálogo"}
        </button>
      </div>

      {/* New catalog form */}
      {showNewCat && (
        <form onSubmit={handleCreateCatalog} style={{ ...card, marginBottom: 24 }}>
          <p style={{ fontSize: "0.8rem", color: "#a0a0b0", marginBottom: 12 }}>
            Elige un nombre para tu nuevo catálogo.
          </p>
          <input name="name" required autoFocus placeholder="Ej: Finanzas, Marketing, Idiomas..." style={input} />
          <button type="submit" disabled={isPending} style={{ ...primaryBtn, marginTop: 12, width: "100%" }}>
            {isPending ? "Creando..." : "Crear catálogo"}
          </button>
        </form>
      )}

      {catalogs.length === 0 && !showNewCat && (
        <div style={{ color: "#6b6b80", fontSize: "0.875rem" }}>
          No tienes catálogos todavía. Pulsa &quot;+ Nuevo catálogo&quot; para crear el primero.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {catalogs.map(cat => {
          const count = links.filter(l => l.catalog_id === cat.id).length;
          return (
            <div key={cat.id}
              onClick={() => setOpenCatalogId(cat.id)}
              style={{ ...card, cursor: "pointer", transition: "border-color .15s", position: "relative" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(232,255,71,0.3)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(232,255,71,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8ff47" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#6b6b80", marginTop: 2 }}>
                    {count} enlace{count !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); startTransition(async () => { await deleteCatalog(cat.id); }); }}
                style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: "#6b6b80", padding: 4 }}
                title="Eliminar catálogo"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Styles ---
const heading: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#f0f0f0",
};
const sub: React.CSSProperties = {
  fontSize: "0.78rem", color: "#6b6b80", marginTop: 3,
};
const card: React.CSSProperties = {
  background: "#111118", border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12, padding: 16,
};
const input: React.CSSProperties = {
  width: "100%", background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "9px 12px", color: "#f0f0f0", fontSize: "0.85rem",
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
const primaryBtn: React.CSSProperties = {
  background: "#e8ff47", color: "#0a0a0f", border: "none", borderRadius: 8,
  padding: "9px 18px", fontSize: "0.82rem", fontWeight: 700,
  cursor: "pointer", fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap",
};
const backBtn: React.CSSProperties = {
  background: "none", border: "none", color: "#a0a0b0", cursor: "pointer",
  fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6,
  padding: "6px 0", fontFamily: "inherit",
};
