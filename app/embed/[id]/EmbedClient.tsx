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

  // Desktop: show on mouse move, auto-hide after 3s
  const revealControls = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  // Mobile: tap toggles controls on/off (like YouTube)
  const handleTouch = (e) => {
    // If tapping a button directly, don't toggle — let the button handle it
    if (e.target.tagName === "BUTTON") return;
    setShowControls((prev) => {
      if (!prev) {
        // Showing — auto-hide after 3s if no further interaction
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
      } else {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
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
    // iOS Safari: use the native <video> element inside the YT iframe
    try {
      const iframe = document.querySelector("#yt-player iframe") as HTMLIFrameElement;
      const video  = iframe?.contentDocument?.querySelector("video") as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
      if (video?.webkitEnterFullscreen) { video.webkitEnterFullscreen(); return; }
    } catch (_) {}
    // Standard fullscreen (Android Chrome, desktop)
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      (document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(document);
    } else {
      (el.requestFullscreen || (el as any).webkitRequestFullscreen)?.call(el);
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
          background: "linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.3) 40%, transparent 70%)",
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
          <button style={btn(false)} onClick={() => skip(-15)}>−15s</button>
          <button style={btn(true)}  onClick={togglePlay}>{playing ? "⏸ Pausa" : "▶ Play"}</button>
          <button style={btn(false)} onClick={() => skip(15)}>+15s</button>
          <div style={{ flex: 1 }} />
          <button style={btn(false)} onClick={toggleMute}>{muted ? "🔇" : "🔊"}</button>
          <button style={btn(false)} onClick={toggleFs}>⛶</button>
        </div>
        </div>{/* end slide wrapper */}
      </div>{/* end overlay */}
    </div>
  );
}
