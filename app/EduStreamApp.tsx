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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
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

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function EduStreamApp() {
  const searchParams = useSearchParams();

  const [view, setView] = useState<View>("add");

  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytCategory, setYtCategory] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [lastEntry, setLastEntry] = useState<VideoEntry | null>(null);

  const [db, setDb] = useState<VideoEntry[]>([]);
  const [filter, setFilter] = useState("");

  const [currentEntry, setCurrentEntry] = useState<VideoEntry | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeCurrent, setTimeCurrent] = useState("0:00");
  const [timeTotal, setTimeTotal] = useState("0:00");

  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const ytReadyRef = useRef(false);
  const pendingVideoIdRef = useRef<string | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  /* ─── Load localStorage ──────────────────── */
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
        playerVars: { modestbranding: 1, rel: 0, showinfo: 0, controls: 0, fs: 0, iv_load_policy: 3 },
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
    return () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current); };
  }, [createPlayer]);

  /* ─── Deep link ?v= ──────────────────────── */
  useEffect(() => {
    const vid = searchParams.get("v");
    if (!vid) return;
    const videos = loadFromStorage();
    const found = videos.find((e) => e.id === vid);
    if (found) openPlayerEntry(found);
    else toast("Video no encontrado", "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Open player ────────────────────────── */
  function openPlayerEntry(entry: VideoEntry) {
    setCurrentEntry(entry);
    setView("player");
    if (!ytReadyRef.current) { pendingVideoIdRef.current = entry.ytId; return; }
    if (!ytPlayerRef.current) { setTimeout(() => createPlayer(entry.ytId), 50); }
    else { ytPlayerRef.current.loadVideoById(entry.ytId); setIsPlaying(true); startProgressTimer(); }
  }

  /* ─── Add video ──────────────────────────── */
  function addVideo() {
    if (!ytUrl.trim()) { toast("Introduce un enlace de YouTube", "error"); return; }
    const ytId = extractYouTubeId(ytUrl.trim());
    if (!ytId) { toast("Enlace de YouTube no válido", "error"); return; }
    const current = loadFromStorage();
    if (current.some((e) => e.ytId === ytId)) { toast("Este video ya existe en tu biblioteca", "error"); return; }
    const entry: VideoEntry = {
      id: genId(), ytId,
      title: ytTitle.trim() || "Video sin título",
      category: ytCategory.trim() || "Sin categoría",
      added: new Date().toISOString(),
    };
    const updated = [entry, ...current];
    saveToStorage(updated);
    setDb(updated);
    const link = platformLink(entry.id);
    setGeneratedLink(link);
    setLastEntry(entry);
    toast("Video añadido correctamente");
  }

  function clearForm() {
    setYtUrl(""); setYtTitle(""); setYtCategory("");
    setGeneratedLink(null); setLastEntry(null);
  }

  function deleteVideo(id: string) {
    const updated = db.filter((e) => e.id !== id);
    saveToStorage(updated); setDb(updated);
    toast("Video eliminado");
  }

  function copyLink(entryId: string) {
    navigator.clipboard.writeText(platformLink(entryId))
      .then(() => toast("Enlace copiado al portapapeles"));
  }

  /* ─── Player controls ────────────────────── */
  function togglePlay() {
    const p = ytPlayerRef.current; if (!p) return;
    if (p.getPlayerState() === window.YT.PlayerState.PLAYING) { p.pauseVideo(); setIsPlaying(false); }
    else { p.playVideo(); setIsPlaying(true); }
  }
  function skipTime(secs: number) {
    const p = ytPlayerRef.current; if (!p) return;
    p.seekTo(Math.max(0, p.getCurrentTime() + secs), true);
  }
  function toggleMute() {
    const p = ytPlayerRef.current; if (!p) return;
    setIsMuted((prev) => { const next = !prev; next ? p.mute() : p.unMute(); return next; });
  }
  function toggleFullscreen() {
    const el = document.getElementById("player-wrap"); if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch((err) => toast(err.message, "error"));
    else document.exitFullscreen();
  }
  function seekFromBar(e: React.MouseEvent<HTMLDivElement>) {
    const p = ytPlayerRef.current; if (!p || typeof p.getDuration !== "function") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    p.seekTo(p.getDuration() * pct, true);
  }
  function backToLibrary() {
    const p = ytPlayerRef.current;
    if (p && typeof p.pauseVideo === "function") p.pauseVideo();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setIsPlaying(false); setView("library");
  }

  const filteredDb = filter
    ? db.filter((e) => e.title.toLowerCase().includes(filter.toLowerCase()) || e.category.toLowerCase().includes(filter.toLowerCase()))
    : db;
  const categories = new Set(db.map((e) => e.category)).size;

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#0a0a0f;--surface:#111118;--card:#16161f;
          --border:rgba(255,255,255,0.07);--text:#f0f0f0;--muted:#666680;
          --accent:#e8ff47;--danger:#ff5c5c;
          --radius:12px;--radius-lg:18px;
          --glow:0 0 24px rgba(232,255,71,0.25);
          --font:Inter,sans-serif;
        }
        body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100vh}
        header{
          display:flex;align-items:center;justify-content:space-between;
          padding:20px 40px;border-bottom:1px solid var(--border);
          position:sticky;top:0;background:rgba(10,10,15,0.85);
          backdrop-filter:blur(20px);z-index:100;
        }
        .logo{font-weight:800;font-size:1.4rem;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px}
        .logo span{color:var(--accent)}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);animation:pulse 2s ease-in-out infinite}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.6}}
        .nav-tabs{display:flex;gap:4px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:4px}
        .nav-tab{padding:8px 20px;border-radius:7px;border:none;background:transparent;color:var(--muted);font-family:var(--font);font-size:.9rem;font-weight:500;cursor:pointer;transition:all .2s}
        .nav-tab.active{background:var(--card);color:var(--text)}
        .nav-tab:hover:not(.active){color:var(--text)}
        main{max-width:1100px;margin:0 auto;padding:40px 24px}
        .section-label{font-size:.72rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
        .section-title{font-size:2rem;font-weight:700;line-height:1.15;margin-bottom:32px}
        .card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;position:relative;overflow:hidden}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:.4}
        .input-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
        @media(max-width:640px){.input-row{grid-template-columns:1fr}}
        .input-group{display:flex;flex-direction:column;gap:8px}
        .input-group.full{grid-column:1/-1}
        label{font-size:.8rem;font-weight:500;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
        input[type=text]{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;font-family:var(--font);font-size:.95rem;color:var(--text);transition:all .2s;outline:none;width:100%}
        input[type=text]:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(232,255,71,.08)}
        input[type=text]::placeholder{color:var(--muted)}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 24px;border-radius:var(--radius);border:none;font-family:var(--font);font-weight:600;font-size:.9rem;cursor:pointer;transition:all .2s;white-space:nowrap}
        .btn-primary{background:var(--accent);color:#0a0a0f}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:var(--glow);filter:brightness(1.05)}
        .btn-ghost{background:var(--surface);color:var(--text);border:1px solid var(--border)}
        .btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
        .btn-danger{background:rgba(255,92,92,.1);color:var(--danger);border:1px solid rgba(255,92,92,.2)}
        .btn-danger:hover{background:rgba(255,92,92,.2)}
        .btn-sm{padding:8px 14px;font-size:.8rem;border-radius:8px}
        .actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:24px}
        .link-result{margin-top:24px;background:var(--surface);border:1px solid var(--accent);border-radius:var(--radius);padding:16px 20px;animation:slideIn .3s ease}
        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .link-result-label{font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
        .link-result-url{font-family:monospace;font-size:.88rem;color:var(--text);word-break:break-all}
        .stats-bar{display:flex;gap:24px;margin-bottom:32px;flex-wrap:wrap}
        .stat{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px 24px;flex:1;min-width:120px}
        .stat-value{font-size:2rem;font-weight:800;color:var(--accent);line-height:1}
        .stat-label{font-size:.78rem;color:var(--muted);margin-top:4px}
        .search-bar{margin-bottom:24px}
        .search-bar input[type=text]{max-width:400px}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
        .video-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;transition:all .25s;cursor:pointer}
        .video-card:hover{border-color:rgba(232,255,71,.25);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.4)}
        .thumb-wrap{position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--surface)}
        .thumb-wrap img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}
        .video-card:hover .thumb-wrap img{transform:scale(1.04)}
        .play-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);opacity:0;transition:opacity .2s}
        .video-card:hover .play-overlay{opacity:1}
        .play-icon{width:44px;height:44px;border-radius:50%;background:var(--accent);color:#0a0a0f;display:flex;align-items:center;justify-content:center;font-size:1.1rem}
        .video-info{padding:16px}
        .video-title{font-weight:600;font-size:.92rem;margin-bottom:4px;line-height:1.4}
        .video-cat{font-size:.78rem;color:var(--muted);display:flex;align-items:center;justify-content:space-between}
        .badge{display:inline-block;padding:2px 8px;background:rgba(232,255,71,.1);color:var(--accent);border-radius:6px;font-size:.72rem;font-weight:600;border:1px solid rgba(232,255,71,.2)}
        .card-actions{padding:0 16px 16px;display:flex;gap:8px}
        .player-page{max-width:900px;margin:0 auto;padding:40px 24px}
        .back-btn{display:inline-flex;align-items:center;gap:8px;background:none;border:none;color:var(--muted);font-family:var(--font);font-size:.88rem;cursor:pointer;padding:0;margin-bottom:24px;transition:color .2s}
        .back-btn:hover{color:var(--text)}
        #player-wrap{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:var(--radius-lg);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6);border:1px solid var(--border)}
        #yt-player{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
        .player-overlay{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.2) 40%,transparent 70%);opacity:0;transition:opacity .3s;z-index:5}
        #player-wrap:hover .player-overlay{opacity:1}
        .progress-bar-wrap{padding:0 24px 4px;display:flex;align-items:center;gap:12px}
        .progress-track{flex:1;height:3px;background:rgba(255,255,255,.2);border-radius:2px;cursor:pointer;position:relative}
        .progress-fill{height:100%;background:var(--accent);border-radius:2px;transition:width .5s linear;width:0%}
        .time-label{font-size:.75rem;color:rgba(255,255,255,.6);font-family:monospace;white-space:nowrap}
        .player-controls{display:flex;align-items:center;gap:10px;padding:20px 24px}
        .ctrl-btn{background:rgba(255,255,255,.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.15);color:white;border-radius:10px;padding:10px 18px;font-family:var(--font);font-weight:600;font-size:.85rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px}
        .ctrl-btn:hover{background:var(--accent);color:#000;border-color:var(--accent)}
        .ctrl-btn.play-pause{background:var(--accent);color:#000;border-color:var(--accent);padding:10px 22px}
        .ctrl-btn.play-pause:hover{filter:brightness(1.1)}
        .ctrl-spacer{flex:1}
        .player-info{padding:0 24px 16px;display:flex;align-items:center;justify-content:space-between}
        .now-playing-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:600}
        .now-playing-title{font-weight:700;font-size:1.1rem}
        .player-back{display:inline-flex;align-items:center;gap:8px;color:var(--muted);font-size:.9rem;cursor:pointer;margin-bottom:24px;transition:color .2s;background:none;border:none;font-family:var(--font)}
        .player-back:hover{color:var(--accent)}
        .player-meta{margin-top:24px;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:start}
        @media(max-width:600px){.player-meta{grid-template-columns:1fr}}
        .player-share-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;min-width:260px}
        .share-label{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600;margin-bottom:10px}
        .link-copy-row{display:flex;gap:10px;align-items:center}
        .link-url{flex:1;font-family:monospace;font-size:.85rem;background:var(--bg);padding:10px 14px;border-radius:8px;border:1px solid var(--border);color:#47d4ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .toast-container{position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:8px;z-index:9999}
        .toast{padding:12px 20px;border-radius:10px;font-size:.88rem;font-weight:500;animation:toastIn .3s ease;max-width:320px}
        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .toast.success{background:#1a2a0a;border:1px solid rgba(232,255,71,.3);color:var(--accent)}
        .toast.error{background:#2a0a0a;border:1px solid rgba(255,92,92,.3);color:var(--danger)}
        .empty-state{text-align:center;padding:80px 32px}
        .empty-icon{font-size:3rem;margin-bottom:16px;opacity:.3}
        .empty-title{font-size:1.2rem;font-weight:700;margin-bottom:8px}
        .empty-desc{color:var(--muted);font-size:.88rem;line-height:1.6}
      `}</style>

      <div>
        {/* ── Header ── */}
        <header>
          <div className="logo">
            <div className="logo-dot" />
            Edu<span>Stream</span>
          </div>
          {view !== "player" && (
            <nav className="nav-tabs" aria-label="Navegación">
              <button className={`nav-tab${view === "add" ? " active" : ""}`} onClick={() => setView("add")}>
                + Añadir
              </button>
              <button className={`nav-tab${view === "library" ? " active" : ""}`} onClick={() => setView("library")}>
                Biblioteca
              </button>
            </nav>
          )}
        </header>

        {/* ── ADD VIEW ── */}
        {view === "add" && (
          <main>
            <div className="section-label">Nueva entrada</div>
            <h1 className="section-title">Añadir Video</h1>
            <div className="card">
              <div className="input-row">
                <div className="input-group full">
                  <label htmlFor="yt-url">Enlace de YouTube</label>
                  <input id="yt-url" type="text" placeholder="https://youtube.com/watch?v=..." value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addVideo()} />
                </div>
                <div className="input-group">
                  <label htmlFor="yt-title">Título (opcional)</label>
                  <input id="yt-title" type="text" placeholder="Nombre del video" value={ytTitle} onChange={(e) => setYtTitle(e.target.value)} />
                </div>
                <div className="input-group">
                  <label htmlFor="yt-cat">Categoría (opcional)</label>
                  <input id="yt-cat" type="text" placeholder="Ej: Matemáticas, Historia..." value={ytCategory} onChange={(e) => setYtCategory(e.target.value)} />
                </div>
              </div>
              <div className="actions">
                <button className="btn btn-primary" onClick={addVideo}>Generar enlace</button>
                <button className="btn btn-ghost" onClick={clearForm}>Limpiar</button>
              </div>
              {generatedLink && lastEntry && (
                <div className="link-result">
                  <div className="link-result-label">Enlace generado</div>
                  <div className="link-result-url">{generatedLink}</div>
                  <div className="actions" style={{ marginTop: "16px" }}>
                    <button className="btn btn-primary btn-sm" onClick={() => copyLink(lastEntry.id)}>Copiar enlace</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openPlayerEntry(lastEntry)}>Reproducir</button>
                    <button className="btn btn-ghost btn-sm" onClick={clearForm}>Nuevo video</button>
                  </div>
                </div>
              )}
            </div>
          </main>
        )}

        {/* ── LIBRARY VIEW ── */}
        {view === "library" && (
          <main>
            <div className="section-label">Contenido guardado</div>
            <h1 className="section-title">Biblioteca</h1>
            <div className="stats-bar">
              <div className="stat"><div className="stat-value">{db.length}</div><div className="stat-label">Videos</div></div>
              <div className="stat"><div className="stat-value">{categories}</div><div className="stat-label">Categorías</div></div>
            </div>
            <div className="search-bar">
              <input type="text" placeholder="Buscar por título o categoría..." value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
            {db.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <div className="empty-title">La biblioteca está vacía</div>
                <div className="empty-desc">Añade tu primer video desde la pestaña &quot;Añadir&quot;.</div>
              </div>
            ) : (
              <div className="grid">
                {filteredDb.map((entry) => (
                  <div key={entry.id} className="video-card">
                    <div className="thumb-wrap" onClick={() => openPlayerEntry(entry)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUrl(entry.ytId)} alt={entry.title} loading="lazy" />
                      <div className="play-overlay"><div className="play-icon">&#9654;</div></div>
                    </div>
                    <div className="video-info" onClick={() => openPlayerEntry(entry)}>
                      <div className="video-title">{entry.title}</div>
                      <div className="video-cat"><span>{entry.category}</span><span className="badge">{entry.category}</span></div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => copyLink(entry.id)}>Copiar enlace</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteVideo(entry.id)}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {/* ── PLAYER VIEW ── */}
        {view === "player" && currentEntry && (
          <main>
            <button className="player-back" onClick={backToLibrary}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Volver a la biblioteca
            </button>
            <div id="player-wrap">
              <div id="yt-player" />
              <div className="player-overlay">
                <div className="progress-bar-wrap">
                  <span className="time-label">{timeCurrent}</span>
                  <div className="progress-track" onClick={seekFromBar}>
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="time-label">{timeTotal}</span>
                </div>
                <div className="player-controls">
                  <button className="ctrl-btn" onClick={() => skipTime(-15)} title="-15 segundos">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>
                    {"\u221215s"}
                  </button>
                  <button className="ctrl-btn play-pause" onClick={togglePlay}>
                    {isPlaying ? "⏸ Pausa" : "⏵ Play"}
                  </button>
                  <button className="ctrl-btn" onClick={() => skipTime(15)} title="+15 segundos">
                    +15s
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6"/><path d="M20.49 15A9 9 0 1 1 20 10"/></svg>
                  </button>
                  <div className="ctrl-spacer" />
                  <button className="ctrl-btn" onClick={toggleMute}>{isMuted ? "🔇 Silencio" : "🔊 Sonido"}</button>
                  <button className="ctrl-btn" onClick={toggleFullscreen}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                    Pantalla completa
                  </button>
                </div>
                <div className="player-info">
                  <div>
                    <div className="now-playing-label">Reproduciendo ahora</div>
                    <div className="now-playing-title">{currentEntry.title}</div>
                  </div>
                  <span className="badge">{currentEntry.category}</span>
                </div>
              </div>
            </div>
            <div className="player-meta">
              <div>
                <div className="section-label" style={{ marginTop: "24px" }}>Detalles del video</div>
                <div style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: "8px" }}>{currentEntry.title}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {"Añadido el "}{new Date(currentEntry.added).toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </div>
              </div>
              <div className="player-share-card">
                <div className="share-label">Compartir enlace de plataforma</div>
                <div className="link-copy-row">
                  <div className="link-url">{platformLink(currentEntry.id)}</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => copyLink(currentEntry.id)}>Copiar</button>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ── Toasts ── */}
        <div className="toast-container" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
          ))}
        </div>
      </div>
    </>
  );
}
