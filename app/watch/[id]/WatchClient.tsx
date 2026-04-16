// @ts-nocheck
"use client";

import { useEffect, useRef, useState, useCallback } from "react";



function fmt(s: number) {
  const t = Math.floor(s || 0);
  const m = Math.floor(t / 60);
  const ss = String(t % 60).padStart(2, "0");
  if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

interface Props { ytId: string; title: string; description: string; }

export default function WatchClient({ ytId, title, description }: Props) {
  const playerRef    = useRef<any>(null);
  const readyRef     = useRef(false);
  const wrapRef      = useRef<HTMLDivElement>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeCur,  setTimeCur]  = useState("0:00");
  const [timeTot,  setTimeTot]  = useState("0:00");

  /* ─── Progress ticker ── */
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      try {
        const cur = p.getCurrentTime();
        const dur = p.getDuration();
        if (!dur) return;
        setProgress((cur / dur) * 100);
        setTimeCur(fmt(cur));
        setTimeTot(fmt(dur));
      } catch (_) {}
    }, 500);
  }, []);

  /* ─── Create player ── same pattern as EduStreamApp ── */
  const createPlayer = useCallback(() => {
    if (playerRef.current || !window.YT?.Player) return;
    playerRef.current = new window.YT.Player("yt-player", {
      videoId: ytId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          readyRef.current = true;
          setPlaying(true);
          startTimer();
        },
        onStateChange: (e: any) => {
          setPlaying(e.data === window.YT.PlayerState.PLAYING);
        },
      },
    });
  }, [ytId, startTimer]);

  /* ─── Load YT API — identical to EduStreamApp ── */
  useEffect(() => {
    if (window.YT?.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
      if (!document.getElementById("yt-api-script")) {
        const tag = document.createElement("script");
        tag.id  = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [createPlayer]);

  /* ─── Controls ── */
  const togglePlay = () => {
    if (!readyRef.current || !playerRef.current) return;
    playing ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const skip = (sec: number) => {
    if (!readyRef.current || !playerRef.current) return;
    playerRef.current.seekTo(Math.max(0, playerRef.current.getCurrentTime() + sec), true);
  };

  const toggleMute = () => {
    if (!readyRef.current || !playerRef.current) return;
    if (muted) { playerRef.current.unMute(); setMuted(false); }
    else        { playerRef.current.mute();   setMuted(true);  }
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!readyRef.current || !playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    playerRef.current.seekTo(((e.clientX - rect.left) / rect.width) * playerRef.current.getDuration(), true);
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #0a0a0f; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .w-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 28px 20px; }
        .w-brand { font-size: .82rem; font-weight: 700; letter-spacing: .14em; color: #e8ff47; text-transform: uppercase; margin-bottom: 28px; text-decoration: none; }
        .w-wrap { position: relative; width: 100%; max-width: 900px; aspect-ratio: 16/9; background: #000; border-radius: 14px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,.75); }
        #yt-player { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .w-overlay { position: absolute; inset: 0; z-index: 10; display: flex; flex-direction: column; justify-content: flex-end; background: linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.1) 50%, transparent 80%); }
        .w-prog-row { display: flex; align-items: center; gap: 10px; padding: 0 22px 6px; }
        .w-prog-track { flex: 1; height: 3px; background: rgba(255,255,255,.18); border-radius: 2px; cursor: pointer; }
        .w-prog-fill { height: 100%; background: #e8ff47; border-radius: 2px; transition: width .45s linear; }
        .w-t { font-size: .72rem; color: rgba(255,255,255,.55); font-variant-numeric: tabular-nums; white-space: nowrap; }
        .w-ctrl { display: flex; align-items: center; gap: 8px; padding: 0 22px 18px; flex-wrap: wrap; }
        .w-btn { background: rgba(255,255,255,.1); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,.14); color: #fff; border-radius: 9px; padding: 9px 16px; font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .18s; font-family: inherit; line-height: 1; }
        .w-btn:hover { background: #e8ff47; color: #000; border-color: #e8ff47; }
        .w-btn.play { background: #e8ff47; color: #000; border-color: #e8ff47; padding: 9px 22px; }
        .w-spacer { flex: 1; }
        .w-title-sm { font-weight: 700; font-size: .9rem; padding: 0 22px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .w-info { width: 100%; max-width: 900px; margin-top: 22px; }
        .w-title { font-size: 1.45rem; font-weight: 700; line-height: 1.3; margin-bottom: 6px; }
        .w-desc { font-size: .88rem; color: rgba(255,255,255,.45); line-height: 1.65; }
        .w-footer { margin-top: 44px; font-size: .75rem; color: rgba(255,255,255,.2); }
        .w-footer a { color: #e8ff47; text-decoration: none; }
        @media (max-width: 600px) { .w-page { padding: 16px 10px; } .w-btn { padding: 7px 11px; font-size: .76rem; } }
      `}</style>

      <div className="w-page">
        <a className="w-brand" href="https://edustream.site">EduStream</a>

        <div className="w-wrap" ref={wrapRef}>
          {/* div replaced by YT IFrame API — pointer-events:none hides YouTube controls */}
          <div id="yt-player" />

          <div className="w-overlay">
            <div className="w-prog-row">
              <span className="w-t">{timeCur}</span>
              <div className="w-prog-track" onClick={seek}>
                <div className="w-prog-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="w-t">{timeTot}</span>
            </div>
            <div className="w-ctrl">
              <button className="w-btn" onClick={() => skip(-15)}>&#8722;15s</button>
              <button className={`w-btn play`} onClick={togglePlay}>
                {playing ? "⏸ Pausa" : "▶ Play"}
              </button>
              <button className="w-btn" onClick={() => skip(15)}>+15s</button>
              <div className="w-spacer" />
              <button className="w-btn" onClick={toggleMute}>
                {muted ? "🔇 Silencio" : "🔊 Sonido"}
              </button>
              <button className="w-btn" onClick={toggleFullscreen}>Pantalla completa</button>
            </div>
            <div className="w-title-sm">{title}</div>
          </div>
        </div>

        <div className="w-info">
          <h1 className="w-title">{title}</h1>
          {description && <p className="w-desc">{description}</p>}
        </div>

        <p className="w-footer">Powered by <a href="https://edustream.site">EduStream</a></p>
      </div>
    </>
  );
}
