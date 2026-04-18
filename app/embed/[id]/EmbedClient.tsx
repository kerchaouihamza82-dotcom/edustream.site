// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";

function fmt(s) {
  const t = Math.floor(s || 0);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

export default function EmbedClient({ ytId, title }) {
  const playerRef    = useRef(null);
  const timerRef     = useRef(null);
  const wrapRef      = useRef(null);
  const hideTimerRef = useRef(null);

  const [playing,      setPlaying]      = useState(false);
  const [muted,        setMuted]        = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [timeCur,      setTimeCur]      = useState("0:00");
  const [timeTot,      setTimeTot]      = useState("0:00");
  const [showControls, setShowControls] = useState(false);
  const [isMobile,     setIsMobile]     = useState(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);
  }, []);

  const HIDE_DELAY = 5000; // 5s — enough time to interact

  // Desktop: show on mouse move, reset timer on any interaction
  const revealControls = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), HIDE_DELAY);
  };

  // Called on every button click to keep controls visible while interacting
  const keepAlive = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), HIDE_DELAY);
  };

  // Mobile: first tap shows, second tap (outside buttons) hides
  const handleTouch = (e) => {
    // Button tap — keep controls visible, reset timer
    const tag = e.target.tagName;
    if (tag === "BUTTON" || tag === "svg" || tag === "path" || tag === "rect" || tag === "polygon" || tag === "line") {
      keepAlive();
      return;
    }
    // Area tap — toggle
    setShowControls((prev) => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (!prev) {
        hideTimerRef.current = setTimeout(() => setShowControls(false), HIDE_DELAY);
      }
      return !prev;
    });
  };

  useEffect(() => {
    /* -- exactly the same as EduStreamApp -- */
    function startTimer() {
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
    }

    function createPlayer() {
      const el = document.getElementById("yt-player");
      if (!el) return;
      if (playerRef.current) return;
      const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      playerRef.current = new (window).YT.Player("yt-player", {
        videoId: ytId,
        playerVars: { modestbranding: 1, rel: 0, showinfo: 0, controls: 0, fs: 0, iv_load_policy: 3, playsinline: 1, mute: mobile ? 1 : 0 },
        events: {
          onReady: (e) => {
            if (mobile) { e.target.mute(); setMuted(true); }
            setPlaying(true);
            e.target.playVideo();
            startTimer();
          },
          onStateChange: (e) => {
            const YT = (window).YT;
            const isPlaying = e.data === YT.PlayerState.PLAYING;
            setPlaying(isPlaying);
            if (e.data === YT.PlayerState.ENDED) {
              if (timerRef.current) clearInterval(timerRef.current);
              setProgress(100);
            }
          },
        },
      });
    }

    /* set callback BEFORE loading script */
    const prev = (window).onYouTubeIframeAPIReady;
    (window).onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      createPlayer();
    };

    /* if API already available, create immediately */
    if ((window).YT && (window).YT.Player) {
      createPlayer();
    } else if (!document.getElementById("yt-api-script")) {
      const tag = document.createElement("script");
      tag.id  = "yt-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try { playerRef.current?.destroy(); } catch (_) {}
    };
  }, []); // run once on mount — ytId is stable

  /* controls */
  const togglePlay = () => {
    keepAlive();
    const p = playerRef.current;
    if (!p) return;
    try { playing ? p.pauseVideo() : p.playVideo(); } catch (_) {}
  };
  const skip = (sec) => {
    keepAlive();
    const p = playerRef.current;
    if (!p) return;
    try { p.seekTo(Math.max(0, p.getCurrentTime() + sec), true); } catch (_) {}
  };
  const toggleMute = () => {
    keepAlive();
    const p = playerRef.current;
    if (!p) return;
    try {
      if (muted) { p.unMute(); setMuted(false); }
      else        { p.mute();  setMuted(true);  }
    } catch (_) {}
  };
  const toggleFs = () => {
    keepAlive();
    const el = wrapRef.current;
    if (!el) return;
    const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    if (isFs) {
      const exit = document.exitFullscreen || (document as any).webkitExitFullscreen;
      if (exit) exit.call(document);
    } else {
      const enter = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).mozRequestFullScreen || (el as any).msRequestFullscreen;
      if (enter) enter.call(el);
    }
  };
  const seekBar = (e) => {
    const p = playerRef.current;
    if (!p) return;
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      p.seekTo(((e.clientX - rect.left) / rect.width) * p.getDuration(), true);
    } catch (_) {}
  };

  const btn = (primary) => ({
    background: primary ? "#e8ff47" : "rgba(255,255,255,.12)",
    border: `1px solid ${primary ? "#e8ff47" : "rgba(255,255,255,.2)"}`,
    color: primary ? "#000" : "#fff",
    borderRadius: 6,
    padding: isMobile ? "6px 10px" : "8px 14px",
    fontSize: isMobile ? ".72rem" : ".8rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    pointerEvents: "auto",
    flexShrink: 0,
  });

  return (
    <div
      ref={wrapRef}
      onMouseMove={isMobile ? undefined : revealControls}
      onTouchStart={isMobile ? handleTouch : undefined}
      style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden",
               fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", cursor: showControls ? "default" : "none" }}
    >
      {/* div vacío — YouTube IFrame API lo reemplaza con el iframe controlado */}
      <div id="yt-player" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

      {/* overlay de controles con fade + slide-up */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column",
                    justifyContent: "flex-end", pointerEvents: "none",
                    opacity: showControls ? 1 : 0,
                    transition: "opacity .35s ease" }}>

        {/* gradiente animado desde abajo */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,.97) 0%, rgba(0,0,0,.75) 35%, rgba(0,0,0,.2) 60%, transparent 80%)",
          opacity: showControls ? 1 : 0,
          transform: showControls ? "translateY(0)" : "translateY(12px)",
          transition: "opacity .35s ease, transform .35s ease",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1,
                      transform: showControls ? "translateY(0)" : "translateY(12px)",
                      transition: "transform .35s ease" }}>

        <div style={{ padding: isMobile ? "0 10px 2px" : "0 16px 4px", color: "#fff",
                      fontSize: isMobile ? ".78rem" : ".85rem", fontWeight: 700,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", pointerEvents: "none" }}>
          {title}
        </div>

        {/* barra de progreso */}
        <div style={{ display: "flex", alignItems: "center", gap: 6,
                      padding: isMobile ? "0 10px 4px" : "0 16px 6px", pointerEvents: "auto" }}>
          <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.6)", minWidth: 28 }}>{timeCur}</span>
          <div onClick={seekBar} style={{ flex: 1, height: isMobile ? 3 : 4,
                                          background: "rgba(255,255,255,.2)", borderRadius: 2, cursor: "pointer" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#e8ff47",
                          borderRadius: 2, transition: "width .4s linear" }} />
          </div>
          <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.6)", minWidth: 28, textAlign: "right" }}>{timeTot}</span>
        </div>

        {/* botones */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 5 : 8,
                      padding: isMobile ? "0 10px 10px" : "0 16px 16px", pointerEvents: "auto",
                      flexWrap: "nowrap", overflow: "hidden" }}>
          {/* -15s */}
          <button style={btn(false)} onClick={() => skip(-15)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 3, verticalAlign: "middle" }}><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>
            15s
          </button>
          {/* play / pause */}
          <button style={btn(true)} onClick={togglePlay}>
            {playing ? (
              // pause: two vertical bars
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4, verticalAlign: "middle" }}><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>
            ) : (
              // play: triangle
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4, verticalAlign: "middle" }}><polygon points="5,3 19,12 5,21"/></svg>
            )}
            {playing ? "Pausa" : "Play"}
          </button>
          {/* +15s */}
          <button style={btn(false)} onClick={() => skip(15)}>
            15s
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 3, verticalAlign: "middle" }}><path d="M23 4v6h-6"/><path d="M20.49 15A9 9 0 1 1 20 10"/></svg>
          </button>
          <div style={{ flex: 1 }} />
          {/* mute / unmute */}
          <button style={btn(false)} onClick={toggleMute}>
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            )}
          </button>
          {/* fullscreen */}
          <button style={btn(false)} onClick={toggleFs}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
        </div>
        </div>{/* end slide wrapper */}
      </div>{/* end overlay */}
    </div>
  );
}
