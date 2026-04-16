"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOut } from "@/app/auth/actions";

interface Video {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  created_at: string;
  slug: string | null;
  views: number | null;
}

interface Props {
  username: string;
  videos: Video[];
  linksCount: number;
}

function thumbUrl(ytId: string) {
  return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
}

function platformLink(slug: string) {
  if (typeof window === "undefined") return `/?v=${slug}`;
  return `${window.location.origin}?v=${slug}`;
}

export default function DashboardClient({ username, videos, linksCount }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  const categories = new Set(videos.map((v) => v.description ?? "Sin categoría")).size;

  return (
    <>
      <style>{`
        .dash-root { min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--font-body); }

        .dash-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 40px;
          border-bottom: 1px solid var(--border);
          background: rgba(10,10,15,0.85);
          backdrop-filter: blur(20px);
          position: sticky; top: 0; z-index: 100;
        }
        .dash-logo {
          font-family: var(--font-head); font-weight: 800;
          font-size: 1.4rem; letter-spacing: -0.5px;
          display: flex; align-items: center; gap: 8px;
        }
        .dash-logo span { color: var(--accent); }
        .dash-logo-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--accent); animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .dash-header-right { display: flex; align-items: center; gap: 12px; }
        .dash-back-btn {
          background: var(--surface); border: 1px solid var(--border);
          color: var(--text); border-radius: 8px;
          padding: 8px 16px; font-family: var(--font-body);
          font-size: 0.85rem; font-weight: 500; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; gap: 6px;
        }
        .dash-back-btn:hover { border-color: var(--accent); color: var(--accent); }
        .dash-signout-btn {
          background: none; border: none;
          color: var(--muted); font-family: var(--font-body);
          font-size: 0.85rem; cursor: pointer; padding: 0;
          transition: color 0.2s;
        }
        .dash-signout-btn:hover { color: var(--danger); }

        .dash-main { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }

        .dash-welcome {
          margin-bottom: 36px;
        }
        .dash-welcome-label {
          font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 8px;
        }
        .dash-welcome-title {
          font-family: var(--font-head); font-size: 2rem; font-weight: 700;
          line-height: 1.15;
        }

        .dash-stats {
          display: flex; gap: 16px; margin-bottom: 40px; flex-wrap: wrap;
        }
        .dash-stat {
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 20px 28px;
          flex: 1; min-width: 160px;
          position: relative; overflow: hidden;
        }
        .dash-stat::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0.3;
        }
        .dash-stat-num {
          font-family: var(--font-head); font-weight: 700;
          font-size: 2rem; color: var(--accent); margin-bottom: 4px;
        }
        .dash-stat-label { font-size: 0.82rem; color: var(--muted); }

        .dash-section-label {
          font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 6px;
        }
        .dash-section-title {
          font-family: var(--font-head); font-size: 1.4rem; font-weight: 700;
          margin-bottom: 20px;
        }

        .dash-add-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent); color: #0a0a0f;
          border: none; border-radius: var(--radius);
          padding: 11px 22px; font-family: var(--font-body);
          font-weight: 600; font-size: 0.88rem;
          cursor: pointer; transition: all 0.2s; margin-bottom: 24px;
        }
        .dash-add-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }

        .dash-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .dash-video-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); overflow: hidden;
          transition: all 0.25s;
        }
        .dash-video-card:hover {
          border-color: rgba(232,255,71,0.3);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        .dash-thumb {
          width: 100%; aspect-ratio: 16/9;
          background: var(--surface); position: relative; overflow: hidden;
        }
        .dash-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .dash-card-body { padding: 14px 16px; }
        .dash-card-title {
          font-family: var(--font-head); font-weight: 600;
          font-size: 0.92rem; margin-bottom: 6px; line-height: 1.3;
        }
        .dash-card-meta {
          font-size: 0.76rem; color: var(--muted);
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
        }
        .dash-badge {
          display: inline-block;
          background: rgba(232,255,71,0.12); color: var(--accent);
          border: 1px solid rgba(232,255,71,0.25);
          border-radius: 6px; padding: 2px 8px;
          font-size: 0.7rem; font-weight: 600;
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .dash-card-actions {
          display: flex; gap: 8px; padding: 10px 16px;
          border-top: 1px solid var(--border);
        }
        .dash-action-btn {
          flex: 1; padding: 7px 10px; border-radius: 7px;
          border: 1px solid var(--border);
          background: var(--surface); color: var(--text);
          font-family: var(--font-body); font-size: 0.78rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 5px;
        }
        .dash-action-btn:hover { border-color: var(--accent); color: var(--accent); }

        .dash-empty {
          grid-column: 1/-1; text-align: center;
          padding: 80px 20px; color: var(--muted);
        }
        .dash-empty-text { font-size: 0.9rem; margin-top: 16px; }

        @media (max-width: 768px) {
          .dash-header { padding: 16px 20px; }
          .dash-main { padding: 24px 16px; }
          .dash-stats { gap: 12px; }
        }
      `}</style>

      <div className="dash-root">
        <header className="dash-header">
          <div className="dash-logo">
            <div className="dash-logo-dot" />
            Edu<span>Stream</span>
          </div>
          <div className="dash-header-right">
            <button className="dash-back-btn" onClick={() => router.push("/")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Ir a la plataforma
            </button>
            <button className="dash-signout-btn" onClick={handleSignOut}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="dash-main">
          <div className="dash-welcome">
            <div className="dash-welcome-label">Panel de usuario</div>
            <div className="dash-welcome-title">
              Hola, {username}
            </div>
          </div>

          <div className="dash-stats">
            <div className="dash-stat">
              <div className="dash-stat-num">{videos.length}</div>
              <div className="dash-stat-label">Videos en biblioteca</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-num">{categories}</div>
              <div className="dash-stat-label">Categorías</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-num">{linksCount}</div>
              <div className="dash-stat-label">Enlaces generados</div>
            </div>
          </div>

          {/* Library Section */}
          <div className="dash-section-label">Tu contenido</div>
          <div className="dash-section-title">Mi biblioteca</div>

          <button className="dash-add-btn" onClick={() => router.push("/")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Añadir nuevo video
          </button>

          <div className="dash-grid">
            {videos.length === 0 ? (
              <div className="dash-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.3, margin: "0 auto" }}>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                <div className="dash-empty-text">
                  No tienes videos aún. Empieza añadiendo el primero.
                </div>
              </div>
            ) : (
              videos.map((video) => {
                const slug = video.slug ?? video.id;
                const date = new Date(video.created_at).toLocaleDateString("es-ES", {
                  day: "2-digit", month: "short", year: "numeric",
                });
                return (
                  <div className="dash-video-card" key={video.id}>
                    <div className="dash-thumb">
                      <Image
                        src={thumbUrl(video.youtube_id)}
                        alt={video.title}
                        width={320}
                        height={180}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="dash-card-body">
                      <div className="dash-card-title">{video.title}</div>
                      <div className="dash-card-meta">
                        <span>{date}</span>
                        <span className="dash-badge">{video.description ?? "Sin categoría"}</span>
                      </div>
                    </div>
                    <div className="dash-card-actions">
                      <button
                        className="dash-action-btn"
                        onClick={() => router.push(`/?v=${slug}`)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Ver
                      </button>
                      <button
                        className="dash-action-btn"
                        onClick={() => {
                          const link = platformLink(slug);
                          navigator.clipboard.writeText(link);
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copiar enlace
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </>
  );
}
