// @ts-nocheck
"use client";

import { useEffect, useRef, useState, useCallback } from "react";



function fmt(s: number) {
  const t = Math.floor(s || 0);
  const m = Math.floor(t / 60);
  const ss = String(t % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

export default function EmbedClient({ ytId, title }: { ytId: string; title: string }) {
  const playerRef = useRef<any>(null);
  const readyRef  = useRef(false);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (playerRef.current) return;
    if (!window.YT?.Player) return;
    playerRef.current = new window.YT.Player("yt-embed-div", {
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
        origin: typeof window !== "undefined" ? window.location.origin : "",
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

  useEffect(() => {
    if (window.YT?.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
      if (!document.getElementById("yt-api")) {
        const tag = document.createElement("script");
        tag.id  = "yt-api";
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
    else        { playerRef.current.mute();   setMuted(true);  }
  };

  const toggleFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!readyRef.current || !playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    playerRef.current.seekTo(pct * playerRef.current.getDuration(), true);
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        background: "#000",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* YouTube player target — pointer-events:none hides all YT native controls */}
      <div
        id="yt-embed-div"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* Controls overlay — always visible, sits on top of the player */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.1) 45%, transparent 70%)",
          pointerEvents: "none", // outer div transparent — only buttons capture clicks
        }}
      >
        {/* Title */}
        <div style={{
          padding: "0 14px 6px",
          fontSize: ".8rem",
          fontWeight: 700,
          color: "#fff",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          pointerEvents: "none",
        }}>
          {title}
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px 5px", pointerEvents: "auto" }}>
          <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.55)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{timeCur}</span>
          <div
            onClick={seek}
            style={{ flex: 1, height: 4, background: "rgba(255,255,255,.2)", borderRadius: 2, cursor: "pointer", position: "relative" }}
          >
            <div style={{ height: "100%", width: `${progress}%`, background: "#e8ff47", borderRadius: 2, transition: "width .4s linear" }} />
          </div>
          <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.55)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{timeTot}</span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px 12px", pointerEvents: "auto" }}>
          <Btn onClick={() => skip(-15)}>&#8722;15s</Btn>
          <Btn primary onClick={togglePlay}>{playing ? "⏸ Pausa" : "▶ Play"}</Btn>
          <Btn onClick={() => skip(15)}>+15s</Btn>
          <div style={{ flex: 1 }} />
          <Btn onClick={toggleMute}>{muted ? "🔇 Silencio" : "🔊 Sonido"}</Btn>
          <Btn onClick={toggleFs}>⛶ Pantalla</Btn>
        </div>
      </div>
    </div>
  );
}

function Btn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const base: React.CSSProperties = {
    background: primary || hovered ? "#e8ff47" : "rgba(255,255,255,.12)",
    border: `1px solid ${primary || hovered ? "#e8ff47" : "rgba(255,255,255,.15)"}`,
    color: primary || hovered ? "#000" : "#fff",
    borderRadius: 7,
    padding: "7px 12px",
    fontSize: ".78rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .15s",
    lineHeight: 1,
    fontFamily: "inherit",
  };
  return (
    <button
      style={base}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}
