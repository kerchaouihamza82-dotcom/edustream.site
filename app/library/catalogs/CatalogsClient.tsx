"use client";

import { useState, useTransition } from "react";
import { createCatalog, deleteCatalog, createLink, deleteLink } from "./actions";

type Catalog = { id: string; name: string; parent_id: string | null; created_at: string };
type Link    = { id: string; title: string; url: string; catalog_id: string; created_at: string };

export default function CatalogsClient({ catalogs, links }: { catalogs: Catalog[]; links: Link[] }) {
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [showNewCat, setShowNewCat]       = useState(false);
  const [showNewLink, setShowNewLink]     = useState(false);
  const [newParent, setNewParent]         = useState<string | null>(null);
  const [isPending, startTransition]      = useTransition();

  // Build tree from flat list
  const roots = catalogs.filter(c => !c.parent_id);
  const children = (parentId: string) => catalogs.filter(c => c.parent_id === parentId);

  const selectedCatalog = catalogs.find(c => c.id === selectedId);
  const catalogLinks    = links.filter(l => l.catalog_id === selectedId);

  const handleCreateCatalog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (newParent) fd.set("parent_id", newParent);
    startTransition(async () => {
      await createCatalog(fd);
      setShowNewCat(false);
      setNewParent(null);
    });
  };

  const handleDeleteCatalog = (id: string) => {
    startTransition(async () => {
      await deleteCatalog(id);
      if (selectedId === id) setSelectedId(null);
    });
  };

  const handleCreateLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("catalog_id", selectedId!);
    startTransition(async () => {
      await createLink(fd);
      setShowNewLink(false);
    });
  };

  const handleDeleteLink = (id: string) => {
    startTransition(async () => { await deleteLink(id); });
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* LEFT — catalog tree */}
      <div style={{
        width: 280, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "28px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#f0f0f0" }}>
            Catálogos
          </h2>
          <button onClick={() => { setShowNewCat(true); setNewParent(null); }} style={btnSmall("#e8ff47", "#0a0a0f")}>
            + Nuevo
          </button>
        </div>

        {/* New catalog form */}
        {showNewCat && (
          <form onSubmit={handleCreateCatalog} style={{ padding: "0 16px 12px" }}>
            <input name="name" autoFocus required placeholder="Nombre del catálogo"
              style={inputStyle} />
            {newParent && (
              <p style={{ fontSize: "0.72rem", color: "#6b6b80", marginTop: 4 }}>
                Subcatálogo de: {catalogs.find(c => c.id === newParent)?.name}
              </p>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button type="submit" disabled={isPending} style={btnSmall("#e8ff47", "#0a0a0f")}>
                {isPending ? "..." : "Crear"}
              </button>
              <button type="button" onClick={() => { setShowNewCat(false); setNewParent(null); }} style={btnSmall("#1e1e2a", "#a0a0b0")}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Tree */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
          {roots.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "#6b6b80", padding: "8px 12px" }}>
              No hay catálogos todavía.
            </p>
          )}
          {roots.map(cat => (
            <CatalogNode
              key={cat.id}
              catalog={cat}
              depth={0}
              selected={selectedId}
              children={children}
              allChildren={children}
              onSelect={setSelectedId}
              onDelete={handleDeleteCatalog}
              onAddChild={(id) => { setNewParent(id); setShowNewCat(true); }}
            />
          ))}
        </div>
      </div>

      {/* RIGHT — links panel */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
        {!selectedCatalog ? (
          <div style={{ color: "#6b6b80", fontSize: "0.875rem", paddingTop: 40 }}>
            Selecciona un catálogo para ver sus enlaces.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#f0f0f0" }}>
                  {selectedCatalog.name}
                </h2>
                <p style={{ fontSize: "0.78rem", color: "#6b6b80", marginTop: 2 }}>
                  {catalogLinks.length} enlace{catalogLinks.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button onClick={() => setShowNewLink(true)} style={btnSmall("#e8ff47", "#0a0a0f")}>
                + Añadir enlace
              </button>
            </div>

            {/* New link form */}
            {showNewLink && (
              <form onSubmit={handleCreateLink} style={{
                background: "#111118", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: 20, marginBottom: 20,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <input name="title" required placeholder="Título del enlace" style={inputStyle} />
                <input name="url" type="url" required placeholder="https://..." style={inputStyle} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={isPending} style={btnSmall("#e8ff47", "#0a0a0f")}>
                    {isPending ? "..." : "Guardar"}
                  </button>
                  <button type="button" onClick={() => setShowNewLink(false)} style={btnSmall("#1e1e2a", "#a0a0b0")}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Links */}
            {catalogLinks.length === 0 && !showNewLink && (
              <p style={{ fontSize: "0.875rem", color: "#6b6b80" }}>
                Este catálogo no tiene enlaces aún. Pulsa &quot;+ Añadir enlace&quot; para empezar.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {catalogLinks.map(link => (
                <LinkCard key={link.id} link={link} onDelete={handleDeleteLink} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CatalogNode({ catalog, depth, selected, children, allChildren, onSelect, onDelete, onAddChild }: {
  catalog: Catalog; depth: number; selected: string | null;
  children: (id: string) => Catalog[];
  allChildren: (id: string) => Catalog[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const kids = children(catalog.id);
  const isSelected = selected === catalog.id;

  return (
    <div style={{ marginLeft: depth * 14 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "7px 10px",
        borderRadius: 8, cursor: "pointer", marginBottom: 1,
        background: isSelected ? "rgba(232,255,71,0.08)" : "transparent",
        transition: "background .15s",
      }}>
        {/* expand toggle */}
        <button onClick={() => setOpen(o => !o)} style={{
          background: "none", border: "none", color: "#6b6b80",
          cursor: "pointer", padding: 0, width: 16, flexShrink: 0, fontSize: "0.7rem",
        }}>
          {kids.length > 0 ? (open ? "▼" : "▶") : " "}
        </button>
        {/* folder icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#e8ff47" : "#6b6b80"} strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        {/* name */}
        <span onClick={() => onSelect(catalog.id)} style={{
          flex: 1, fontSize: "0.85rem", color: isSelected ? "#e8ff47" : "#c0c0d0",
          fontWeight: isSelected ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {catalog.name}
        </span>
        {/* actions */}
        <button onClick={() => onAddChild(catalog.id)} title="Subcatálogo" style={iconBtn}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <button onClick={() => onDelete(catalog.id)} title="Eliminar" style={{ ...iconBtn, color: "#ff5c5c" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
        </button>
      </div>
      {open && kids.map(child => (
        <CatalogNode
          key={child.id} catalog={child} depth={depth + 1}
          selected={selected} children={allChildren} allChildren={allChildren}
          onSelect={onSelect} onDelete={onDelete} onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}

function LinkCard({ link, onDelete }: { link: Link; onDelete: (id: string) => void }) {
  return (
    <div style={{
      background: "#111118", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: "#1a1a26",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b80" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f0f0f0", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {link.title}
        </div>
        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{
          fontSize: "0.75rem", color: "#6b6b80", textDecoration: "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
        }}>
          {link.url}
        </a>
      </div>
      <button onClick={() => onDelete(link.id)} style={{ ...iconBtn, color: "#ff5c5c", flexShrink: 0 }} title="Eliminar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "9px 12px", color: "#f0f0f0", fontSize: "0.85rem",
  outline: "none", fontFamily: "inherit",
};

const iconBtn: React.CSSProperties = {
  background: "none", border: "none", color: "#6b6b80", cursor: "pointer",
  padding: 3, display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: 4, flexShrink: 0,
};

function btnSmall(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: "none", borderRadius: 6,
    padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap",
  };
}
