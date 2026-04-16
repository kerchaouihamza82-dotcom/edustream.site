"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/auth/actions";
import type { User } from "@supabase/supabase-js";

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

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function EduStreamApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(true);

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
  const [dbLoading, setDbLoading] = useState(false);

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

  /* ─── Auth state ─────────────────────────── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user?.user_metadata?.username) {
        setUsername(user.user_metadata.username);
      } else if (user) {
        // Fallback: derive from email
        setUsername(user.email?.replace("@app.local", "") ?? "");
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      const u = session?.user;
      if (u?.user_metadata?.username) {
        setUsername(u.user_metadata.username);
      } else if (u) {
        setUsername(u.email?.replace("@app.local", "") ?? "");
      } else {
        setUsername("");
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Load DB from Supabase ──────────────── */
  const loadVideos = useCallback(async () => {
    if (!user) return;
    setDbLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("id, youtube_id, title, description, created_at, slug")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast("Error cargando la biblioteca", "error");
    } else {
      setDb(
        (data ?? []).map((v) => ({
          id: v.slug ?? v.id,
          ytId: v.youtube_id,
          title: v.title,
          category: v.description ?? "Sin categoría",
          added: v.created_at,
        }))
      );
    }
    setDbLoading(false);
  }, [user, supabase, toast]);

  useEffect(() => {
    if (user) loadVideos();
    else setDb([]);
  }, [user, loadVideos]);

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
    if (authLoading) return;
    const vid = searchParams.get("v");
    if (!vid) return;

    async function loadDeepLink() {
      // Try Supabase first (public read policy on videos)
      const { data } = await supabase
        .from("videos")
        .select("id, youtube_id, title, description, created_at, slug")
        .eq("slug", vid)
        .eq("is_active", true)
        .maybeSingle();

      if (data) {
        const entry: VideoEntry = {
          id: data.slug ?? data.id,
          ytId: data.youtube_id,
          title: data.title,
          category: data.description ?? "Sin categoría",
          added: data.created_at,
        };
        openPlayerEntry(entry);
      } else {
        toast("Video no encontrado en esta plataforma", "error");
      }
    }

    loadDeepLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  /* ─── Open player ────────────────────────── */
  function openPlayerEntry(entry: VideoEntry) {
    setCurrentEntry(entry);
    setView("player");

    if (!ytReadyRef.current) {
      pendingVideoIdRef.current = entry.ytId;
      return;
    }

    if (!ytPlayerRef.current) {
      setTimeout(() => createPlayer(entry.ytId), 50);
    } else {
      ytPlayerRef.current.loadVideoById(entry.ytId);
      setIsPlaying(true);
      startProgressTimer();
    }
  }

  /* ─── Add video ──────────────────────────── */
  async function addVideo() {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (!ytUrl.trim()) {
      toast("Introduce un enlace de YouTube", "error");
      return;
    }
    const ytId = extractYouTubeId(ytUrl.trim());
    if (!ytId) {
      toast("Enlace de YouTube no válido", "error");
      return;
    }

    // Check duplicate for this user
    const { data: existing } = await supabase
      .from("videos")
      .select("id")
      .eq("user_id", user.id)
      .eq("youtube_id", ytId)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      toast("Este video ya existe en tu biblioteca", "error");
      return;
    }

    const slug = genId();

    const { data: inserted, error } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        youtube_id: ytId,
        title: ytTitle.trim() || "Video sin título",
        description: ytCategory.trim() || "Sin categoría",
        slug,
        is_active: true,
        views: 0,
      })
      .select("id, youtube_id, title, description, created_at, slug")
      .single();

    if (error || !inserted) {
      toast("Error al añadir el video", "error");
      return;
    }

    const entry: VideoEntry = {
      id: inserted.slug ?? inserted.id,
      ytId: inserted.youtube_id,
      title: inserted.title,
      category: inserted.description ?? "Sin categoría",
      added: inserted.created_at,
    };

    // Save generated link to links table
    const link = platformLink(entry.id);
    await supabase.from("links").insert({
      user_id: user.id,
      url: link,
    });

    setDb((prev) => [entry, ...prev]);
    setGeneratedLink(link);
    setLastEntry(entry);
    toast("Video añadido correctamente");
  }

  function clearForm() {
    setYtUrl("");
    setYtTitle("");
    setYtCategory("");
    setGeneratedLink(null);
    setLastEntry(null);
  }

  /* ─── Delete video ───────────────────────── */
  async function deleteVideo(id: string) {
    if (!user) return;
    // Soft delete via is_active = false
    await supabase
      .from("videos")
      .update({ is_active: false })
      .eq("slug", id)
      .eq("user_id", user.id);

    setDb((prev) => prev.filter((e) => e.id !== id));
    toast("Video eliminado");
  }

  function copyLink(entryId: string) {
    navigator.clipboard
      .writeText(platformLink(entryId))
      .then(() => toast("Enlace copiado al portapapeles"));
  }

  /* ─── Player controls ────────────────────── */
  function togglePlay() {
    const p = ytPlayerRef.current;
    if (!p) return;
    const state = p.getPlayerState();
    if (state === window.YT.PlayerState.PLAYING) {
      p.pauseVideo();
      setIsPlaying(false);
    } else {
      p.playVideo();
      setIsPlaying(true);
    }
  }

  function skipTime(secs: number) {
    const p = ytPlayerRef.current;
    if (!p) return;
    p.seekTo(Math.max(0, p.getCurrentTime() + secs), true);
  }

  function toggleMute() {
    const p = ytPlayerRef.current;
    if (!p) return;
    setIsMuted((prev) => {
      const next = !prev;
      next ? p.mute() : p.unMute();
      return next;
    });
  }

  function toggleFullscreen() {
    const el = document.getElementById("player-wrap");
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) =>
        toast("Error pantalla completa: " + err.message, "error")
      );
    } else {
      document.exitFullscreen();
    }
  }

  function seekFromBar(e: React.MouseEvent<HTMLDivElement>) {
    const p = ytPlayerRef.current;
    if (!p || typeof p.getDuration !== "function") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    p.seekTo(p.getDuration() * pct, true);
  }

  function backToLibrary() {
    const p = ytPlayerRef.current;
    if (p && typeof p.pauseVideo === "function") p.pauseVideo();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setIsPlaying(false);
    setView("library");
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setDb([]);
    router.push("/auth/login");
  }

  /* ─── Derived values ─────────────────────── */
  const filteredDb = filter
    ? db.filter(
        (e) =>
          e.title.toLowerCase().includes(filter.toLowerCase()) ||
          e.category.toLowerCase().includes(filter.toLowerCase())
      )
    : db;

  const categories = new Set(db.map((e) => e.category)).size;

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <>
      <style>{`
        .app { position: relative; z-index: 1; }

        header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 40px;
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0;
          background: rgba(10,10,15,0.85);
          backdrop-filter: blur(20px);
          z-index: 100;
        }
        .logo {
          font-family: var(--font-head);
          font-weight: 800; font-size: 1.4rem;
          letter-spacing: -0.5px;
          display: flex; align-items: center; gap: 8px;
        }
        .logo span { color: var(--accent); }
        .logo-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--accent);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .nav-tabs {
          display: flex; gap: 4px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 4px;
        }
        .nav-tab {
          padding: 8px 20px; border-radius: 7px;
          border: none; background: transparent;
          color: var(--muted);
          font-family: var(--font-body); font-size: 0.9rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .nav-tab.active { background: var(--card); color: var(--text); }
        .nav-tab:hover:not(.active) { color: var(--text); }

        .user-pill {
          display: flex; align-items: center; gap: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 6px 14px;
        }
        .user-avatar {
          width: 24px; height: 24px; border-radius: 50%;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; font-weight: 700; color: #0a0a0f;
        }
        .user-name { font-size: 0.85rem; font-weight: 500; color: var(--text); }
        .sign-out-btn {
          background: none; border: none;
          color: var(--muted); font-family: var(--font-body);
          font-size: 0.8rem; cursor: pointer; padding: 0;
          transition: color 0.2s;
        }
        .sign-out-btn:hover { color: var(--danger); }
        .sign-in-btn {
          padding: 8px 18px; border-radius: 8px;
          background: var(--accent); color: #0a0a0f;
          border: none; font-family: var(--font-body);
          font-weight: 600; font-size: 0.85rem;
          cursor: pointer; transition: all 0.2s;
        }
        .sign-in-btn:hover { filter: brightness(1.08); }

        main { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }

        .section-label {
          font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 8px;
        }
        .section-title {
          font-family: var(--font-head);
          font-size: 2rem; font-weight: 700;
          line-height: 1.15; margin-bottom: 32px;
        }

        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 32px; position: relative; overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0.4;
        }

        .auth-prompt {
          text-align: center; padding: 60px 32px;
        }
        .auth-prompt-title {
          font-family: var(--font-head);
          font-size: 1.4rem; font-weight: 700;
          margin-bottom: 12px;
        }
        .auth-prompt-desc {
          color: var(--muted); font-size: 0.9rem;
          margin-bottom: 24px; max-width: 360px; margin-inline: auto;
          line-height: 1.6;
        }

        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        @media (max-width: 640px) { .input-row { grid-template-columns: 1fr; } }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group.full { grid-column: 1 / -1; }
        label {
          font-size: 0.8rem; font-weight: 500; letter-spacing: 0.05em;
          text-transform: uppercase; color: var(--muted);
        }
        input[type="text"] {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 16px;
          font-family: var(--font-body); font-size: 0.95rem;
          color: var(--text);
          transition: all 0.2s; outline: none; width: 100%;
        }
        input[type="text"]:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(232,255,71,0.08);
        }
        input[type="text"]::placeholder { color: var(--muted); }

        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; padding: 13px 24px;
          border-radius: var(--radius); border: none;
          font-family: var(--font-body); font-weight: 600; font-size: 0.9rem;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .btn-primary { background: var(--accent); color: #0a0a0f; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: var(--glow); filter: brightness(1.05); }
        .btn-primary:active { transform: translateY(0); }
        .btn-ghost { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .btn-danger { background: rgba(255,92,92,0.1); color: var(--danger); border: 1px solid rgba(255,92,92,0.2); }
        .btn-danger:hover { background: rgba(255,92,92,0.2); }
        .btn-sm { padding: 8px 14px; font-size: 0.8rem; border-radius: 8px; }
        .actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 24px; }

        .link-result {
          margin-top: 24px;
          background: var(--surface);
          border: 1px solid var(--accent);
          border-radius: var(--radius); padding: 16px 20px;
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .link-result-label {
          font-size: 0.75rem; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--accent);
          font-weight: 600; margin-bottom: 10px;
        }
        .link-copy-row { display: flex; gap: 10px; align-items: center; }
        .link-url {
          flex: 1; font-family: monospace; font-size: 0.85rem;
          background: var(--bg); padding: 10px 14px;
          border-radius: 8px; border: 1px solid var(--border);
          color: var(--accent2);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .library-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
        }
        .library-search {
          display: flex; align-items: center; gap: 10px;
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 10px 16px;
          flex: 1; max-width: 300px;
        }
        .library-search input {
          background: none; border: none; outline: none;
          font-family: var(--font-body); font-size: 0.9rem;
          color: var(--text); width: 100%;
        }
        .library-search input::placeholder { color: var(--muted); }
        .library-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .video-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); overflow: hidden;
          transition: all 0.25s; cursor: pointer;
        }
        .video-card:hover {
          border-color: rgba(232,255,71,0.3);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        .video-thumb {
          width: 100%; aspect-ratio: 16/9;
          background: var(--surface); position: relative; overflow: hidden;
        }
        .video-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .thumb-play {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.4);
          opacity: 0; transition: opacity 0.2s;
        }
        .video-card:hover .thumb-play { opacity: 1; }
        .thumb-play-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: var(--accent); color: #000;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; padding-left: 4px;
        }
        .video-card-body { padding: 16px; }
        .video-card-title {
          font-family: var(--font-head); font-weight: 600; font-size: 0.95rem;
          margin-bottom: 6px; line-height: 1.3;
        }
        .video-card-meta {
          font-size: 0.78rem; color: var(--muted);
          display: flex; align-items: center; justify-content: space-between;
        }
        .video-card-actions {
          display: flex; gap: 8px; padding: 12px 16px;
          border-top: 1px solid var(--border);
        }
        .empty-state { text-align: center; padding: 80px 20px; color: var(--muted); }
        .empty-text { font-size: 0.9rem; }

        .player-back {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--muted); font-size: 0.9rem; cursor: pointer;
          margin-bottom: 24px; transition: color 0.2s;
          background: none; border: none;
          font-family: var(--font-body);
        }
        .player-back:hover { color: var(--accent); }
        .player-wrap {
          background: #000;
          border-radius: var(--radius-lg); overflow: hidden;
          position: relative; aspect-ratio: 16/9;
          box-shadow: var(--shadow); border: 1px solid var(--border);
        }
        .player-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
        .player-overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; justify-content: flex-end;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 70%);
          opacity: 0; transition: opacity 0.3s; z-index: 5;
        }
        .player-wrap:hover .player-overlay { opacity: 1; }
        .player-controls { display: flex; align-items: center; gap: 10px; padding: 20px 24px; }
        .ctrl-btn {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.15);
          color: white; border-radius: 10px;
          padding: 10px 18px;
          font-family: var(--font-body); font-weight: 600; font-size: 0.85rem;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 6px;
        }
        .ctrl-btn:hover { background: var(--accent); color: #000; border-color: var(--accent); }
        .ctrl-btn.play-pause { background: var(--accent); color: #000; border-color: var(--accent); padding: 10px 22px; }
        .ctrl-btn.play-pause:hover { filter: brightness(1.1); }
        .ctrl-spacer { flex: 1; }
        .player-info {
          padding: 0 24px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .now-playing-label {
          font-size: 0.7rem; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--accent); font-weight: 600;
        }
        .now-playing-title { font-family: var(--font-head); font-weight: 700; font-size: 1.1rem; }
        .progress-bar-wrap { padding: 0 24px 4px; display: flex; align-items: center; gap: 12px; }
        .progress-track {
          flex: 1; height: 3px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px; cursor: pointer; position: relative;
        }
        .progress-fill {
          height: 100%; background: var(--accent);
          border-radius: 2px; transition: width 0.5s linear;
        }
        .time-label { font-size: 0.75rem; color: rgba(255,255,255,0.6); font-family: monospace; white-space: nowrap; }
        .player-meta {
          margin-top: 24px;
          display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: start;
        }
        @media (max-width: 600px) { .player-meta { grid-template-columns: 1fr; } }
        .player-share-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 20px;
        }
        .share-label {
          font-size: 0.75rem; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--muted);
          font-weight: 600; margin-bottom: 10px;
        }

        .toast-container {
          position: fixed; bottom: 24px; right: 24px; z-index: 999;
          display: flex; flex-direction: column; gap: 10px; pointer-events: none;
        }
        .toast {
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 14px 20px;
          font-size: 0.88rem; font-weight: 500;
          display: flex; align-items: center; gap: 10px;
          box-shadow: var(--shadow);
          animation: toastIn 0.3s ease;
          max-width: 320px;
        }
        .toast.success { border-color: rgba(232,255,71,0.4); }
        .toast.error   { border-color: rgba(255,92,92,0.4); }
        .toast-icon { font-size: 1rem; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .badge {
          display: inline-block;
          background: rgba(232,255,71,0.12);
          color: var(--accent);
          border: 1px solid rgba(232,255,71,0.25);
          border-radius: 6px; padding: 3px 9px;
          font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.05em; text-transform: uppercase;
        }

        .divider { height: 1px; background: var(--border); margin: 36px 0; }

        .stats-row { display: flex; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
        .stat-pill {
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 12px 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .stat-num { font-family: var(--font-head); font-weight: 700; font-size: 1.4rem; color: var(--accent); }
        .stat-desc { font-size: 0.8rem; color: var(--muted); }

        @media (max-width: 768px) {
          header { padding: 16px 20px; }
          main   { padding: 24px 16px; }
          .card  { padding: 20px; }
          .player-controls { flex-wrap: wrap; gap: 8px; }
          .nav-tabs { display: none; }
        }
      `}</style>

      <div className="app">
        {/* ─── Header ───────────────────────────────── */}
        <header>
          <div className="logo">
            <div className="logo-dot" />
            Edu<span>Stream</span>
          </div>
          <div className="header-right">
            {!authLoading && user && (
              <div className="nav-tabs">
                <button
                  className={`nav-tab${view === "add" ? " active" : ""}`}
                  onClick={() => setView("add")}
                >
                  + Añadir Video
                </button>
                <button
                  className={`nav-tab${
                    view === "library" || view === "player" ? " active" : ""
                  }`}
                  onClick={() => {
                    setView("library");
                    setFilter("");
                  }}
                >
                  Biblioteca
                </button>
              </div>
            )}

            {!authLoading && user ? (
              <div className="user-pill">
                <div className="user-avatar">
                  {username.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{username}</span>
                <button className="sign-out-btn" onClick={handleSignOut}>
                  Salir
                </button>
              </div>
            ) : !authLoading ? (
              <button
                className="sign-in-btn"
                onClick={() => router.push("/auth/login")}
              >
                Iniciar sesión
              </button>
            ) : null}
          </div>
        </header>

        {/* ─── Main ─────────────────────────────────── */}
        <main>

          {/* ══ ADD VIDEO VIEW ═════════════════════════ */}
          {view === "add" && (
            <div>
              <div className="section-label">Panel de administración</div>
              <div className="section-title">Añadir nuevo video</div>

              <div className="card">
                {!user ? (
                  <div className="auth-prompt">
                    <div className="auth-prompt-title">
                      Inicia sesión para continuar
                    </div>
                    <div className="auth-prompt-desc">
                      Debes tener una cuenta para añadir videos y generar
                      enlaces de plataforma personalizados.
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => router.push("/auth/login")}
                    >
                      Iniciar sesión o registrarse
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="input-row">
                      <div className="input-group full">
                        <label htmlFor="yt-url">Enlace de YouTube</label>
                        <input
                          id="yt-url"
                          type="text"
                          value={ytUrl}
                          onChange={(e) => setYtUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="yt-title">Título del curso / clase</label>
                        <input
                          id="yt-title"
                          type="text"
                          value={ytTitle}
                          onChange={(e) => setYtTitle(e.target.value)}
                          placeholder="Ej: Introducción a JavaScript — Clase 1"
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="yt-category">Categoría (opcional)</label>
                        <input
                          id="yt-category"
                          type="text"
                          value={ytCategory}
                          onChange={(e) => setYtCategory(e.target.value)}
                          placeholder="Ej: Programación, Diseño, Marketing…"
                        />
                      </div>
                    </div>

                    <div className="actions">
                      <button className="btn btn-primary" onClick={addVideo}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Añadir a la plataforma
                      </button>
                      <button className="btn btn-ghost" onClick={clearForm}>
                        Limpiar
                      </button>
                    </div>

                    {generatedLink && (
                      <div className="link-result">
                        <div className="link-result-label">
                          Enlace de plataforma generado
                        </div>
                        <div className="link-copy-row">
                          <div className="link-url">{generatedLink}</div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              navigator.clipboard
                                .writeText(generatedLink)
                                .then(() => toast("Enlace copiado al portapapeles"))
                            }
                          >
                            Copiar
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => lastEntry && openPlayerEntry(lastEntry)}
                          >
                            Ver
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="divider" />

              <div className="section-label">Información</div>
              <div className="section-title">¿Cómo funciona?</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: "16px" }}>
                {[
                  {
                    icon: "🔗",
                    title: "Enlace propio",
                    desc: "Cuando alguien abre el enlace compartido, ve tu plataforma — no el canal de YouTube directamente.",
                  },
                  {
                    icon: "🎬",
                    title: "Reproductor personalizado",
                    desc: "Overlay con Play/Pause, retroceder 15s, avanzar 15s y pantalla completa.",
                  },
                  {
                    icon: "🔒",
                    title: "Videos privados",
                    desc: "Funciona con videos no listados o privados de YouTube siempre que tengas el enlace directo.",
                  },
                  {
                    icon: "☁️",
                    title: "Guardado en la nube",
                    desc: "Todos tus videos se guardan en Supabase, accesibles desde cualquier dispositivo.",
                  },
                ].map((item) => (
                  <div className="card" key={item.title} style={{ padding: "20px" }}>
                    <div style={{ fontSize: "1.6rem", marginBottom: "12px" }}>{item.icon}</div>
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, marginBottom: "6px" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6 }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ LIBRARY VIEW ═══════════════════════════ */}
          {view === "library" && (
            <div>
              {!user ? (
                <div className="card">
                  <div className="auth-prompt">
                    <div className="auth-prompt-title">Inicia sesión para ver tu biblioteca</div>
                    <div className="auth-prompt-desc">
                      Tus videos guardados aparecen aquí una vez que hayas iniciado sesión.
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => router.push("/auth/login")}
                    >
                      Iniciar sesión
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="stats-row">
                    <div className="stat-pill">
                      <div className="stat-num">{db.length}</div>
                      <div className="stat-desc">Videos totales</div>
                    </div>
                    <div className="stat-pill">
                      <div className="stat-num">{categories}</div>
                      <div className="stat-desc">Categorías</div>
                    </div>
                  </div>

                  <div className="library-header">
                    <div>
                      <div className="section-label">Tu colección</div>
                      <div className="section-title" style={{ marginBottom: 0 }}>
                        Biblioteca de videos
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <div className="library-search">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)", flexShrink: 0 }}>
                          <circle cx="11" cy="11" r="8" />
                          <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Buscar video…"
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                        />
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setView("add")}>
                        + Añadir
                      </button>
                    </div>
                  </div>

                  {dbLoading ? (
                    <div className="empty-state">
                      <div className="empty-text">Cargando biblioteca...</div>
                    </div>
                  ) : (
                    <div className="library-grid">
                      {filteredDb.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                          <div style={{ fontSize: "3rem", marginBottom: "16px", opacity: 0.4 }}>
                            🎬
                          </div>
                          <div className="empty-text">
                            {filter ? "No se encontraron resultados." : "No hay videos aún. ¡Añade el primero!"}
                          </div>
                        </div>
                      ) : (
                        filteredDb.map((entry) => {
                          const date = new Date(entry.added).toLocaleDateString("es-ES", {
                            day: "2-digit", month: "short", year: "numeric",
                          });
                          return (
                            <div className="video-card" key={entry.id} onClick={() => openPlayerEntry(entry)}>
                              <div className="video-thumb">
                                <Image
                                  src={thumbUrl(entry.ytId)}
                                  alt={entry.title}
                                  width={320}
                                  height={180}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  crossOrigin="anonymous"
                                />
                                <div className="thumb-play">
                                  <div className="thumb-play-icon">&#9654;</div>
                                </div>
                              </div>
                              <div className="video-card-body">
                                <div className="video-card-title">{entry.title}</div>
                                <div className="video-card-meta">
                                  <span>{date}</span>
                                  <span className="badge">{entry.category}</span>
                                </div>
                              </div>
                              <div className="video-card-actions" onClick={(e) => e.stopPropagation()}>
                                <button className="btn btn-ghost btn-sm" onClick={() => copyLink(entry.id)}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                  Copiar enlace
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteVideo(entry.id)}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                                  </svg>
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══ PLAYER VIEW ════════════════════════════ */}
          {view === "player" && currentEntry && (
            <div>
              <button className="player-back" onClick={backToLibrary}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Volver a la biblioteca
              </button>

              <div className="player-wrap" id="player-wrap">
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-5" />
                      </svg>
                      -15s
                    </button>
                    <button className="ctrl-btn play-pause" onClick={togglePlay}>
                      {isPlaying ? "⏸ Pausa" : "⏵ Play"}
                    </button>
                    <button className="ctrl-btn" onClick={() => skipTime(15)} title="+15 segundos">
                      +15s
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M23 4v6h-6" /><path d="M20.49 15A9 9 0 1 1 20 10" />
                      </svg>
                    </button>
                    <div className="ctrl-spacer" />
                    <button className="ctrl-btn" onClick={toggleMute}>
                      {isMuted ? "Silencio" : "Sonido"}
                    </button>
                    <button className="ctrl-btn" onClick={toggleFullscreen}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                      Pantalla completa
                    </button>
                  </div>
                  <div className="player-info">
                    <div>
                      <div className="now-playing-label">Reproduciendo ahora</div>
                      <div className="now-playing-title">{currentEntry.title}</div>
                    </div>
                    <div className="badge">{currentEntry.category}</div>
                  </div>
                </div>
              </div>

              <div className="player-meta">
                <div>
                  <div className="section-label" style={{ marginTop: "24px" }}>
                    Detalles del video
                  </div>
                  <div style={{ fontFamily: "var(--font-head)", fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>
                    {currentEntry.title}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    Añadido el{" "}
                    {new Date(currentEntry.added).toLocaleDateString("es-ES", {
                      weekday: "long", day: "2-digit", month: "long", year: "numeric",
                    })}
                  </div>
                </div>
                <div className="player-share-card" style={{ minWidth: "260px" }}>
                  <div className="share-label">Compartir enlace de plataforma</div>
                  <div className="link-copy-row">
                    <div className="link-url" style={{ fontSize: "0.8rem" }}>
                      {platformLink(currentEntry.id)}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        navigator.clipboard
                          .writeText(platformLink(currentEntry.id))
                          .then(() => toast("Enlace copiado"))
                      }
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── Toast container ──────────────────────── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">{t.type === "success" ? "✓" : "✕"}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
