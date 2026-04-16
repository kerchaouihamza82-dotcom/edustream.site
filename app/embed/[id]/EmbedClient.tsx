// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";

function fmt(s) {
  const t = Math.floor(s || 0);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

export default function EmbedClient({ ytId, title }) {
  const playerRef   = useRef(null);
  const readyRef    = useRef(false);
  const wrapRef     = useRef(null);
  const timerRef    = useRef(null);
  const apiReadyRef = useRef(false);

  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeCur,  setTimeCur]  = useState("0:00");
  const [timeTot,  setTimeTot]  = useState("0:00");

  useEffect(() => {
    function startTimer() {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const p = playerRef.current;
        if (!p) return;
        try {
          const cur = p.getCurrentTime();
          const dur = p.getDuration();
          if (!dur) return;
          setProgress((cur / dur) * 100);
          setTimeCur(fmt(cur));
          setTimeTot(fmt(dur));
        } catch (_) {}
      }, 500);
    }

    function initPlayer() {
      // Wait until the div is in the DOM
      const el = document.getElementById("yt-embed-div");
      if (!el) { setTimeout(initPlayer, 50); return; }
      if (playerRef.current) return;

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
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            readyRef.current = true;
            e.target.playVideo();
            setPlaying(true);
            startTimer();
          },
          onStateChange: (e) => {
            const YT = window.YT;
            setPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.ENDED) {
              clearInterval(timerRef.current);
              setProgress(100);
            }
          },
        },
      });
    }

    // If the API is already loaded, init immediately
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Chain with any existing callback
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initPlayer();
      };
      if (!document.getElementById("yt-api-script")) {
        const tag = document.createElement("script");
        tag.id  = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      clearInterval(timerRef.current);
      try { playerRef.current?.destroy(); } catch (_) {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    try { playing ? p.pauseVideo() : p.playVideo(); } catch (_) {}
  };

  const skip = (sec) => {
    const p = playerRef.current;
    if (!p) return;
    try { p.seekTo(Math.max(0, p.getCurrentTime() + sec), true); } catch (_) {}
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (muted) { p.unMute(); setMuted(false); }
      else        { p.mute();  setMuted(true);  }
    } catch (_) {}
  };

  const toggleFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.();
  };

  const seekBar = (e) => {
    const p = playerRef.current;
    if (!p) return;
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      p.seekTo(((e.clientX - rect.left) / rect.width) * p.getDuration(), true);
    } catch (_) {}
  };

  const btnStyle = (primary) => ({
    background: primary ? "#e8ff47" : "rgba(255,255,255,.12)",
    border: `1px solid ${primary ? "#e8ff47" : "rgba(255,255,255,.2)"}`,
    color: primary ? "#000" : "#fff",
    borderRadius: 7,
    padding: "8px 14px",
    fontSize: ".8rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  });

  return (
    <div
      ref={wrapRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Empty div — YouTube IFrame API replaces this with the controlled iframe */}
      <div
        id="yt-embed-div"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />

      {/* Controls overlay — always on top, buttons always capture clicks */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.05) 40%, transparent 65%)",
          pointerEvents: "none",
        }}
      >
        {/* Title */}
        <div style={{ padding: "0 16px 4px", color: "#fff", fontSize: ".85rem", fontWeight: 700, pointerEvents: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px 6px", pointerEvents: "auto" }}>
          <span style={{ fontSize: ".7rem", color: "rgba(255,255,255,.6)", fontVariantNumeric: "tabular-nums" }}>{timeCur}</span>
          <div onClick={seekBar} style={{ flex: 1, height: 4, background: "rgba(255,255,255,.2)", borderRadius: 2, cursor: "pointer" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#e8ff47", borderRadius: 2, transition: "width .4s linear" }} />
          </div>
          <span style={{ fontSize: ".7rem", color: "rgba(255,255,255,.6)", fontVariantNumeric: "tabular-nums" }}>{timeTot}</span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px 14px", pointerEvents: "auto" }}>
          <button style={btnStyle(false)} onClick={() => skip(-15)}>−15s</button>
          <button style={btnStyle(true)}  onClick={togglePlay}>{playing ? "⏸ Pausa" : "▶ Play"}</button>
          <button style={btnStyle(false)} onClick={() => skip(15)}>+15s</button>
          <div style={{ flex: 1 }} />
          <button style={btnStyle(false)} onClick={toggleMute}>{muted ? "🔇 Silencio" : "🔊 Sonido"}</button>
          <button style={btnStyle(false)} onClick={toggleFs}>⛶ Pantalla</button>
        </div>
      </div>
    </div>
  );
}
