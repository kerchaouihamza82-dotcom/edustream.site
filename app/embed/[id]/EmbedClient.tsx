// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

function fmt(s) {
  const t = Math.floor(s || 0);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

const HIDE_DELAY = 3000;

export default function EmbedClient({ ytId, title, embedId }) {
  const searchParams = useSearchParams();
  const startAt      = parseInt(searchParams.get("t") ?? "0", 10) || 0;

  const playerRef    = useRef(null);
  const timerRef     = useRef(null);
  const wrapRef      = useRef(null);
  const hideTimerRef = useRef(null);
  const iosTokenRef  = useRef(null);
  const isMobileRef  = useRef(false);

  const [playing,      setPlaying]      = useState(false);
  const [muted,        setMuted]        = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [timeCur,      setTimeCur]      = useState("0:00");
  const [timeTot,      setTimeTot]      = useState("0:00");
  const [showControls, setShowControls] = useState(true);
  const [isMobile,     setIsMobile]     = useState(false);
  const [isFs,         setIsFs]         = useState(false);

  // ── Detect device ──────────────────────────────────────────────────────────
  useEffect(() => {
    const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    setIsMobile(mobile);
    isMobileRef.current = mobile;
  }, []);

  // ── Pre-fetch iOS token ────────────────────────────────────────────────────
  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isIOS || !embedId) return;
    const fetchToken = () => {
      fetch(`/api/embed-token?videoId=${embedId}`)
        .then((r) => r.json())
        .then((d) => { if (d.token) iosTokenRef.current = d.token; })
        .catch(() => {});
    };
    fetchToken();
    const iv = setInterval(fetchToken, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, [embedId]);

  // ── Controls visibility ────────────────────────────────────────────────────
  const scheduleHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      // Never hide when paused
      try {
        const YT = (window as any).YT;
        const state = playerRef.current?.getPlayerState?.();
        if (YT && state === YT.PlayerState.PAUSED) return;
      } catch (_) {}
      setShowControls(false);
    }, HIDE_DELAY);
  };

  const revealControls = () => {
    setShowControls(true);
    scheduleHide();
  };

  const cancelHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  // ── YouTube player setup ───────────────────────────────────────────────────
  useEffect(() => {
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
      if (!document.getElementById("yt-player") || playerRef.current) return;
      const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      playerRef.current = new window.YT.Player("yt-player", {
        videoId: ytId,
        playerVars: {
          modestbranding: 1, rel: 0, showinfo: 0,
          controls: 0, fs: 0, iv_load_policy: 3,
          playsinline: 1,
          start: startAt > 0 ? startAt : undefined,
          mute: mobile ? 1 : 0,
        },
        events: {
          onReady: (e) => {
            if (mobile) { e.target.mute(); setMuted(true); }
            setPlaying(true);
            e.target.playVideo();
            startTimer();
            setShowControls(true);
            scheduleHide();
          },
          onStateChange: (e) => {
            const YT = window.YT;
            const isPlaying = e.data === YT.PlayerState.PLAYING;
            const isPaused  = e.data === YT.PlayerState.PAUSED;
            setPlaying(isPlaying);
            if (isPaused) { cancelHide(); setShowControls(true); }
            if (isPlaying) { setShowControls(true); scheduleHide(); }
            if (e.data === YT.PlayerState.ENDED) {
              if (timerRef.current) clearInterval(timerRef.current);
              setProgress(100);
            }
          },
        },
      });
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); createPlayer(); };
    if (window.YT?.Player) { createPlayer(); }
    else if (!document.getElementById("yt-api-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try { playerRef.current?.destroy(); } catch (_) {}
    };
  }, []);

  // ── Player actions ─────────────────────────────────────────────────────────
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

  const seekBar = (e) => {
    const p = playerRef.current;
    if (!p) return;
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
      if (clientX === undefined) return;
      p.seekTo(((clientX - rect.left) / rect.width) * p.getDuration(), true);
    } catch (_) {}
  };

  const toggleFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const embedUrl = `https://edustream.site/embed/${embedId}`;

    const inFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    if (inFs) {
      const exit = document.exitFullscreen || (document as any).webkitExitFullscreen;
      if (exit) exit.call(document);
      setIsFs(false);
      return;
    }

    if (isIOS) {
      const t = Math.floor(playerRef.current?.getCurrentTime?.() ?? 0);
      const token = iosTokenRef.current;
      const qs = token ? `?token=${token}${t > 0 ? `&t=${t}` : ""}` : (t > 0 ? `?t=${t}` : "");
      const a = document.createElement("a");
      a.href = `${embedUrl}${qs}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const enter = el.requestFullscreen || (el as any).webkitRequestFullscreen;
    if (enter) {
      (enter.call(el) as Promise<void>).then(() => setIsFs(true)).catch(() => {});
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const btn = (primary) => ({
    background: primary ? "#e8ff47" : "rgba(255,255,255,.12)",
    border: `1px solid ${primary ? "#e8ff47" : "rgba(255,255,255,.2)"}`,
    color: primary ? "#000" : "#fff",
    borderRadius: 5,
    padding: isMobile ? "4px 8px" : "8px 14px",
    fontSize: isMobile ? ".68rem" : ".8rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    flexShrink: 0,
  });

  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      style={{
        position: "fixed", top: 0, left: 0,
        width: isFs ? "100vw" : "100%",
        height: isFs ? "100vh" : "100%",
        zIndex: isFs ? 999999 : 0,
        background: "#000", overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        // Handle mouse at the wrapper level — works even when mouse is over iframe
        cursor: "default",
      }}

    >
      {/* YouTube iframe — pointerEvents none always. We handle all interaction ourselves. */}
      <div
        id="yt-player"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />

      {/* Click capture layer — sits above iframe, below controls.
          Desktop: mouse events here because children absorb events before wrapper.
          Click toggles play. Mobile: tap toggles controls. */}
      <div
        style={{ position: "absolute", inset: 0, zIndex: 5, background: "transparent" }}
        onMouseMove={!isMobile ? revealControls : undefined}
        onMouseEnter={!isMobile ? revealControls : undefined}
        onMouseLeave={!isMobile ? scheduleHide : undefined}
        onClick={!isMobile ? togglePlay : undefined}
        onTouchEnd={isMobile ? (e) => {
          // If touch was on a button, let the button handle it
          if ((e.target as HTMLElement).closest("button")) return;
          if (showControls) {
            // Controls visible — hide them
            cancelHide();
            setShowControls(false);
          } else {
            // Controls hidden — reveal and auto-hide if playing
            setShowControls(true);
            try {
              const YT = (window as any).YT;
              const state = playerRef.current?.getPlayerState?.();
              if (!YT || state !== YT.PlayerState.PAUSED) scheduleHide();
            } catch (_) { scheduleHide(); }
          }
        } : undefined}
      />

      {/* Controls overlay */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          pointerEvents: "none",
          opacity: showControls ? 1 : 0,
          transition: "opacity .25s ease",
        }}
      >
        {/* Gradient background */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.5) 30%, transparent 65%)",
        }} />

        {/* Controls content — pointerEvents auto so buttons work */}
        <div
          style={{
            position: "relative", zIndex: 1,
            pointerEvents: showControls ? "auto" : "none",
          }}
          // Stop mouse events from bubbling to wrapper and resetting the hide timer
          onMouseMove={(e) => e.stopPropagation()}
          onMouseEnter={(e) => { e.stopPropagation(); cancelHide(); }}
          onMouseLeave={(e) => { e.stopPropagation(); scheduleHide(); }}
        >
          {/* Title */}
          <div style={{
            padding: isMobile ? "0 10px 2px" : "0 16px 4px",
            color: "#fff", fontSize: isMobile ? ".78rem" : ".85rem", fontWeight: 700,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {title}
          </div>

          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "0 10px 4px" : "0 16px 6px" }}>
            <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.6)", minWidth: 28 }}>{timeCur}</span>
            <div
              onClick={seekBar}
              onTouchStart={seekBar}
              style={{ flex: 1, height: 4, background: "rgba(255,255,255,.2)", borderRadius: 2, cursor: "pointer" }}
            >
              <div style={{ height: "100%", width: `${progress}%`, background: "#e8ff47", borderRadius: 2, transition: "width .4s linear" }} />
            </div>
            <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.6)", minWidth: 28, textAlign: "right" }}>{timeTot}</span>
          </div>

          {/* Buttons */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: isMobile ? 5 : 8,
            padding: isMobile ? "0 10px 12px" : "0 16px 16px",
            flexWrap: "nowrap", overflow: "hidden",
          }}>
            <button style={btn(false)} onClick={() => skip(-15)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 3, verticalAlign: "middle" }}><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>
              15s
            </button>

            <button style={{ ...btn(true), display: "inline-flex", alignItems: "center", gap: 4 }} onClick={togglePlay}>
              {playing ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              )}
              <span>{playing ? "Pausa" : "Play"}</span>
            </button>

            <button style={btn(false)} onClick={() => skip(15)}>
              15s
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 3, verticalAlign: "middle" }}><path d="M23 4v6h-6"/><path d="M20.49 15A9 9 0 1 1 20 10"/></svg>
            </button>

            <div style={{ flex: 1 }} />

            <button style={btn(false)} onClick={toggleMute}>
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              )}
            </button>

            {!isIOS && (
              <button style={btn(false)} onClick={toggleFs}>
                {isFs ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
