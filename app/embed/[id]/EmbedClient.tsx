"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    YT: { Player: new (el: string | HTMLElement, opts: object) => any; PlayerState: { PLAYING: number } };
    onYouTubeIframeAPIReady: () => void;
  }
}

function fmt(s: number) {
  const t = Math.floor(s || 0);
  const m = Math.floor(t / 60);
  const ss = String(t % 60).padStart(2, "0");
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export default function EmbedClient({ ytId, title }: { ytId: string; title: string }) {
  const playerRef  = useRef<any>(null);
  const readyRef   = useRef(false);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeCur,  setTimeCur]  = useState("0:00");
  const [timeTot,  setTimeTot]  = useState("0:00");

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

  const createPlayer = useCallback(() => {
    if (playerRef.current || !window.YT?.Player) return;
    playerRef.current = new window.YT.Player("yt-embed-player", {
      videoId: ytId,
      playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3, disablekb: 1, fs: 0, playsinline: 1 },
      events: {
        onReady: () => { readyRef.current = true; setPlaying(true); startTimer(); },
        onStateChange: (e: any) => setPlaying(e.data === window.YT.PlayerState.PLAYING),
      },
    });
  }, [ytId, startTimer]);

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
    else        { playerRef.current.mute();   setMuted(true); }
  };
  const toggleFs = () => {
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
        html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
        .embed-wrap { position: relative; width: 100%; height: 100%; background: #000; }
        #yt-embed-player { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .embed-overlay { position: absolute; inset: 0; z-index: 10; display: flex; flex-direction: column; justify-content: flex-end; background: linear-gradient(to top, rgba(0,0,0,.9) 0%, transparent 60%); }
        .e-prog-row { display: flex; align-items: center; gap: 8px; padding: 0 14px 5px; }
        .e-track { flex: 1; height: 3px; background: rgba(255,255,255,.2); border-radius: 2px; cursor: pointer; }
        .e-fill { height: 100%; background: #e8ff47; border-radius: 2px; transition: width .4s linear; }
        .e-t { font-size: .68rem; color: rgba(255,255,255,.5); font-variant-numeric: tabular-nums; white-space: nowrap; font-family: monospace; }
        .e-ctrl { display: flex; align-items: center; gap: 6px; padding: 0 14px 12px; flex-wrap: wrap; }
        .e-btn { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.15); color: #fff; border-radius: 7px; padding: 7px 13px; font-size: .78rem; font-weight: 600; cursor: pointer; transition: all .16s; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1; }
        .e-btn:hover { background: #e8ff47; color: #000; border-color: #e8ff47; }
        .e-btn.play { background: #e8ff47; color: #000; border-color: #e8ff47; }
        .e-spacer { flex: 1; }
        .e-title { padding: 0 14px 10px; font-size: .8rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>

      <div className="embed-wrap" ref={wrapRef}>
        <div id="yt-embed-player" />
        <div className="embed-overlay">
          <div className="e-prog-row">
            <span className="e-t">{timeCur}</span>
            <div className="e-track" onClick={seek}>
              <div className="e-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="e-t">{timeTot}</span>
          </div>
          <div className="e-ctrl">
            <button className="e-btn" onClick={() => skip(-15)}>&#8722;15s</button>
            <button className={`e-btn play`} onClick={togglePlay}>{playing ? "⏸ Pausa" : "▶ Play"}</button>
            <button className="e-btn" onClick={() => skip(15)}>+15s</button>
            <div className="e-spacer" />
            <button className="e-btn" onClick={toggleMute}>{muted ? "🔇" : "🔊"}</button>
            <button className="e-btn" onClick={toggleFs}>&#x26F6;</button>
          </div>
          <div className="e-title">{title}</div>
        </div>
      </div>
    </>
  );
}
