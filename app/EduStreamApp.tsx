"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

/* ─── Types ────────────────────────────────────────────────── */
interface VideoEntry {
  id: string;
  ytId: string;
  title: string;
  category: string;
  added: string;
}

type View = "add" | "library" | "player";

/* ─── Helpers ──────────────────────────────────────────────── */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([^&?#\s]{11})/,
    /youtube\.com\/watch\?.*v=([^&\s]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

function thumbUrl(ytId: string) {
  return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
}

function platformLink(slug: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}?v=${slug}`;
}

function formatTime(s: number) {
  s = Math.floor(s);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, "0")}:${ss}`;
  }
  return `${m}:${ss}`;
}

/* ─── Toast ────────────────────────────────────────────────── */
interface ToastItem {
  id: number;
  msg: string;
  type: "success" | "error";
}

/* ─── YouTube IFrame API types ─────────────────────────────── */
declare global {
  interface Window {
    YT: {
      Player: new (el: string | HTMLElement, opts: object) => YTPlayerInstance;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (id: string) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (t: number, allowSeekAhead: boolean) => void;
  getPlayerState: () => number;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
}

const STORAGE_KEY = "edustream_videos";

function loadFromStorage(): VideoEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveToStorage(videos: VideoEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function EduStreamApp() {
  const searchParams = useSearchParams();

  const [view, setView] = useState<View>("add");

  /* ─── Add-video form ─────────────────────── */
  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytCategory, setYtCategory] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [lastEntry, setLastEntry] = useState<VideoEntry | null>(null);

  /* ─── Library ────────────────────────────── */
  const [db, setDb] = useState<VideoEntry[]>([]);
  const [filter, setFilter] = useState("");

  /* ─── Player ─────────────────────────────── */
  const [currentEntry, setCurrentEntry] = useState<VideoEntry | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeCurrent, setTimeCurrent] = useState("0:00");
  const [timeTotal, setTimeTotal] = useState("0:00");

  /* ─── YouTube refs ───────────────────────── */
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const ytReadyRef = useRef(false);
  const pendingVideoIdRef = useRef<string | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Toasts ─────────────────────────────── */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastCounter = useRef(0);

  const toast = useCallback(
    (msg: string, type: "success" | "error" = "success") => {
      const id = ++toastCounter.current;
      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    },
    []
  );

  /* ─── Load from localStorage ─────────────── */
  useEffect(() => {
    setDb(loadFromStorage());
  }, []);

  /* ─── Progress timer ─────────────────────── */
  const startProgressTimer = useCallback(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      try {
        const cur = p.getCurrentTime();
        const dur = p.getDuration();
        if (!dur) return;
        setProgress((cur / dur) * 100);
        setTimeCurrent(formatTime(cur));
        setTimeTotal(formatTime(dur));
      } catch {}
    }, 500);
  }, []);

  /* ─── Create YT player ───────────────────── */
  const createPlayer = useCallback(
    (ytId: string) => {
      const el = document.getElementById("yt-player");
      if (!el) return;
      ytPlayerRef.current = new window.YT.Player("yt-player", {
        videoId: ytId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          controls: 0,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (e: { target: YTPlayerInstance }) => {
            setIsPlaying(true);
            e.target.playVideo();
            startProgressTimer();
          },
          onStateChange: (e: { data: number }) => {
            const playing = e.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            if (e.data === window.YT.PlayerState.ENDED) {
              if (progressTimerRef.current) clearInterval(progressTimerRef.current);
              setProgress(100);
            }
          },
        },
      });
    },
    [startProgressTimer]
  );

  /* ─── Load YouTube API ───────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.onYouTubeIframeAPIReady = () => {
      ytReadyRef.current = true;
      if (pendingVideoIdRef.current) {
        createPlayer(pendingVideoIdRef.current);
        pendingVideoIdRef.current = null;
      }
    };

    if (!document.getElementById("yt-api-script")) {
      const script = document.createElement("script");
      script.id = "yt-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [createPlayer]);

  /* ─── Deep link ?v= ──────────────────────── */
  useEffect(() => {
    const vid = searchParams.get("v");
    if (!vid) return;
    const all = loadFromStorage();
    const found = all.find((e) => e.id === vid);
    if (found) {
      setCurrentEntry(found);
      setView("player");
    }
  }, [searchParams]);

  /* ─── Play a video ───────────────────────── */
  const playEntry = useCallback(
    (entry: VideoEntry) => {
      setCurrentEntry(entry);
      setProgress(0);
      setTimeCurrent("0:00");
      setTimeTotal("0:00");
      setIsPlaying(false);

      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }

      setView("player");

      setTimeout(() => {
        if (ytReadyRef.current) {
          createPlayer(entry.ytId);
        } else {
          pendingVideoIdRef.current = entry.ytId;
        }
      }, 100);
    },
    [createPlayer]
  );

  /* ─── Add video ──────────────────────────── */
  const handleAdd = useCallback(() => {
    const ytId = extractYouTubeId(ytUrl.trim());
    if (!ytId) { toast("URL de YouTube no válida", "error"); return; }
    if (!ytTitle.trim()) { toast("Escribe un título", "error"); return; }

    const id = genId();
    const entry: VideoEntry = {
      id,
      ytId,
      title: ytTitle.trim(),
      category: ytCategory.trim() || "Sin categoría",
      added: new Date().toISOString(),
    };

    const updated = [entry, ...db];
    setDb(updated);
    saveToStorage(updated);

    const link = platformLink(id);
    setGeneratedLink(link);
    setLastEntry(entry);
    setYtUrl("");
    setYtTitle("");
    setYtCategory("");
    toast("Video añadido correctamente");
  }, [ytUrl, ytTitle, ytCategory, db, toast]);

  /* ─── Delete video ───────────────────────── */
  const handleDelete = useCallback(
    (id: string) => {
      const updated = db.filter((v) => v.id !== id);
      setDb(updated);
      saveToStorage(updated);
      toast("Video eliminado");
    },
    [db, toast]
  );

  /* ─── Copy link ──────────────────────────── */
  const copyLink = useCallback(
    (link: string) => {
      navigator.clipboard.writeText(link).then(
        () => toast("Enlace copiado"),
        () => toast("No se pudo copiar", "error")
      );
    },
    [toast]
  );

  /* ─── Player controls ────────────────────── */
  const togglePlay = useCallback(() => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (isPlaying) { p.pauseVideo(); setIsPlaying(false); }
    else { p.playVideo(); setIsPlaying(true); startProgressTimer(); }
  }, [isPlaying, startProgressTimer]);

  const toggleMute = useCallback(() => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (isMuted) { p.unMute(); setIsMuted(false); }
    else { p.mute(); setIsMuted(true); }
  }, [isMuted]);

  const skip = useCallback((secs: number) => {
    const p = ytPlayerRef.current;
    if (!p) return;
    p.seekTo(p.getCurrentTime() + secs, true);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const p = ytPlayerRef.current;
    if (!p) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    p.seekTo(ratio * p.getDuration(), true);
  }, []);

  const enterFullscreen = useCallback(() => {
    const el = document.getElementById("player-wrapper");
    if (el?.requestFullscreen) el.requestFullscreen();
  }, []);

  const filtered = db.filter(
    (v) =>
      v.title.toLowerCase().includes(filter.toLowerCase()) ||
      v.category.toLowerCase().includes(filter.toLowerCase())
  );

  /* ══ RENDER ══════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; color: #e5e5e5; font-family: 'Inter', system-ui, sans-serif; }
        .app { min-height: 100vh; display: flex; flex-direction: column; }

        /* ── Header ── */
        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px; background: #111; border-bottom: 1px solid #222;
          position: sticky; top: 0; z-index: 50;
        }
        .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-icon { width: 32px; height: 32px; background: #e50914; border-radius: 6px;
          display: flex; align-items: center; justify-content: center; }
        .logo-text { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
        .logo-text span { color: #e50914; }
        .nav { display: flex; gap: 4px; }
        .nav-btn {
          padding: 7px 16px; border-radius: 6px; border: none; cursor: pointer;
          font-size: 14px; font-weight: 500; transition: all .15s;
          background: transparent; color: #aaa;
        }
        .nav-btn:hover { background: #1e1e1e; color: #fff; }
        .nav-btn.active { background: #e50914; color: #fff; }

        /* ── Main ── */
        .main { flex: 1; padding: 32px 24px; max-width: 900px; margin: 0 auto; width: 100%; }

        /* ── Card ── */
        .card {
          background: #111; border: 1px solid #222; border-radius: 12px;
          padding: 28px; margin-bottom: 24px;
        }
        .card-title { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 20px; }

        /* ── Form ── */
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 13px; color: #888; margin-bottom: 6px; font-weight: 500; }
        .form-input {
          width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px;
          padding: 10px 14px; color: #e5e5e5; font-size: 14px; outline: none;
          transition: border-color .15s;
        }
        .form-input:focus { border-color: #e50914; }
        .form-input::placeholder { color: #555; }
        .btn {
          padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;
          font-size: 14px; font-weight: 600; transition: all .15s;
        }
        .btn-primary { background: #e50914; color: #fff; }
        .btn-primary:hover { background: #c4060f; }
        .btn-secondary { background: #1e1e1e; color: #ccc; }
        .btn-secondary:hover { background: #2a2a2a; color: #fff; }
        .btn-danger { background: transparent; color: #e50914; border: 1px solid #e50914; }
        .btn-danger:hover { background: #e50914; color: #fff; }

        /* ── Generated link ── */
        .link-box {
          background: #0d1f0f; border: 1px solid #1a4a1e; border-radius: 10px;
          padding: 20px; margin-top: 20px;
        }
        .link-box h3 { font-size: 14px; color: #4caf50; font-weight: 600; margin-bottom: 12px; }
        .link-copy-row { display: flex; gap: 10px; align-items: center; }
        .link-text {
          flex: 1; background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 6px;
          padding: 8px 12px; color: #7ee87a; font-size: 13px; font-family: monospace;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ── Library ── */
        .search-bar {
          width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px;
          padding: 10px 14px; color: #e5e5e5; font-size: 14px; outline: none;
          margin-bottom: 20px; transition: border-color .15s;
        }
        .search-bar:focus { border-color: #e50914; }
        .video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .video-card {
          background: #0d0d0d; border: 1px solid #1e1e1e; border-radius: 10px;
          overflow: hidden; cursor: pointer; transition: border-color .15s, transform .15s;
        }
        .video-card:hover { border-color: #e50914; transform: translateY(-2px); }
        .thumb-wrap { position: relative; aspect-ratio: 16/9; background: #111; }
        .thumb-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .play-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,.4);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .15s;
        }
        .video-card:hover .play-overlay { opacity: 1; }
        .play-circle {
          width: 48px; height: 48px; background: #e50914; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .video-info { padding: 12px; }
        .video-title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .video-cat { font-size: 12px; color: #666; margin-bottom: 10px; }
        .video-actions { display: flex; gap: 8px; }
        .icon-btn {
          background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px;
          padding: 5px 10px; cursor: pointer; font-size: 12px; color: #888;
          transition: all .15s; display: flex; align-items: center; gap: 4px;
        }
        .icon-btn:hover { background: #252525; color: #fff; }
        .icon-btn.del:hover { border-color: #e50914; color: #e50914; }

        /* ── Player ── */
        .player-container { position: relative; background: #000; border-radius: 12px; overflow: hidden; }
        #yt-player { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .player-aspect { aspect-ratio: 16/9; position: relative; }
        .player-overlay {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          justify-content: flex-end; background: linear-gradient(transparent 40%, rgba(0,0,0,.85));
          z-index: 10;
        }
        .controls { padding: 16px; }
        .progress-bar {
          width: 100%; height: 4px; background: rgba(255,255,255,.2);
          border-radius: 2px; cursor: pointer; margin-bottom: 12px; position: relative;
        }
        .progress-fill { height: 100%; background: #e50914; border-radius: 2px; transition: width .1s; }
        .controls-row { display: flex; align-items: center; gap: 12px; }
        .ctrl-btn {
          background: none; border: none; cursor: pointer; color: #fff;
          width: 36px; height: 36px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; transition: background .15s; padding: 0;
        }
        .ctrl-btn:hover { background: rgba(255,255,255,.15); }
        .ctrl-btn svg { width: 20px; height: 20px; fill: currentColor; }
        .time-display { font-size: 13px; color: rgba(255,255,255,.7); font-variant-numeric: tabular-nums; margin-left: auto; }

        /* ── Toasts ── */
        .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
        .toast {
          padding: 12px 18px; border-radius: 8px; font-size: 14px; font-weight: 500;
          color: #fff; animation: slideIn .2s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,.4);
        }
        .toast.success { background: #1a3a1e; border: 1px solid #2d6a35; }
        .toast.error { background: #3a1a1a; border: 1px solid #6a2d2d; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        .empty-state { text-align: center; padding: 60px 20px; color: #555; }
        .empty-state h3 { font-size: 18px; color: #666; margin-bottom: 8px; }
      `}</style>

      <div className="app">
        {/* ── HEADER ── */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="logo-text">Edu<span>Stream</span></span>
          </div>
          <nav className="nav">
            <button className={`nav-btn${view === "add" ? " active" : ""}`} onClick={() => setView("add")}>
              + Añadir
            </button>
            <button className={`nav-btn${view === "library" ? " active" : ""}`} onClick={() => setView("library")}>
              Biblioteca ({db.length})
            </button>
            {currentEntry && (
              <button className={`nav-btn${view === "player" ? " active" : ""}`} onClick={() => setView("player")}>
                Reproduciendo
              </button>
            )}
          </nav>
        </header>

        <main className="main">
          {/* ── ADD VIDEO ── */}
          {view === "add" && (
            <div className="card">
              <h2 className="card-title">Añadir nuevo video</h2>
              <div className="form-group">
                <label className="form-label">URL de YouTube</label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Título del video"
                  value={ytTitle}
                  onChange={(e) => setYtTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría (opcional)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ej: Matemáticas, Ciencias..."
                  value={ytCategory}
                  onChange={(e) => setYtCategory(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={handleAdd}>
                Generar enlace
              </button>

              {generatedLink && lastEntry && (
                <div className="link-box">
                  <h3>Enlace generado para &quot;{lastEntry.title}&quot;</h3>
                  <div className="link-copy-row">
                    <div className="link-text">{generatedLink}</div>
                    <button className="btn btn-secondary" onClick={() => copyLink(generatedLink)}>
                      Copiar
                    </button>
                    <button className="btn btn-primary" onClick={() => { setCurrentEntry(lastEntry); setView("player"); setTimeout(() => { if (ytReadyRef.current) createPlayer(lastEntry.ytId); else pendingVideoIdRef.current = lastEntry.ytId; }, 100); }}>
                      Reproducir
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── LIBRARY ── */}
          {view === "library" && (
            <div>
              <input
                className="search-bar"
                placeholder="Buscar por título o categoría..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <h3>{db.length === 0 ? "Tu biblioteca está vacía" : "Sin resultados"}</h3>
                  <p>{db.length === 0 ? "Añade tu primer video desde la pestaña + Añadir" : "Prueba con otro término de búsqueda"}</p>
                </div>
              ) : (
                <div className="video-grid">
                  {filtered.map((v) => (
                    <div key={v.id} className="video-card">
                      <div className="thumb-wrap" onClick={() => playEntry(v)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbUrl(v.ytId)} alt={v.title} />
                        <div className="play-overlay">
                          <div className="play-circle">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="video-info">
                        <div className="video-title">{v.title}</div>
                        <div className="video-cat">{v.category}</div>
                        <div className="video-actions">
                          <button className="icon-btn" onClick={() => copyLink(platformLink(v.id))}>
                            Copiar enlace
                          </button>
                          <button className="icon-btn del" onClick={() => handleDelete(v.id)}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PLAYER ── */}
          {view === "player" && currentEntry && (
            <div>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setView("library")}>
                  ← Volver
                </button>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>{currentEntry.title}</h2>
              </div>
              <div className="player-container" id="player-wrapper">
                <div className="player-aspect">
                  <div id="yt-player" />
                  <div className="player-overlay">
                    <div className="controls">
                      <div className="progress-bar" onClick={handleSeek}>
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="controls-row">
                        {/* Skip back */}
                        <button className="ctrl-btn" onClick={() => skip(-15)} title="-15s">
                          <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="8.5" y="16" fontSize="5" fill="currentColor" fontWeight="bold">15</text></svg>
                        </button>
                        {/* Play/Pause */}
                        <button className="ctrl-btn" onClick={togglePlay}>
                          {isPlaying ? (
                            <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                          ) : (
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          )}
                        </button>
                        {/* Skip forward */}
                        <button className="ctrl-btn" onClick={() => skip(15)} title="+15s">
                          <svg viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="8.5" y="16" fontSize="5" fill="currentColor" fontWeight="bold">15</text></svg>
                        </button>
                        {/* Mute */}
                        <button className="ctrl-btn" onClick={toggleMute}>
                          {isMuted ? (
                            <svg viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                          ) : (
                            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                          )}
                        </button>
                        {/* Fullscreen */}
                        <button className="ctrl-btn" onClick={enterFullscreen}>
                          <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                        </button>
                        <span className="time-display">{timeCurrent} / {timeTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => copyLink(platformLink(currentEntry.id))}>
                  Copiar enlace
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── TOASTS ── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}
