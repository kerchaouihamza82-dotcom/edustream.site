"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Props {
  ytId: string;
  title: string;
  description: string;
}

function fmt(s: number) {
  const total = Math.floor(s || 0);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
}

export default function WatchClient({ ytId, title, description }: Props) {
  const playerRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeCur, setTimeCur] = useState("0:00");
  const [timeTot, setTimeTot] = useState("0:00");

  const tick = useCallback(() => {
    if (!playerRef.current) return;
    try {
      const cur: number = playerRef.current.getCurrentTime();
      const dur: number = playerRef.current.getDuration();
      if (dur > 0) {
        setProgress((cur / dur) * 100);
        setTimeCur(fmt(cur));
        setTimeTot(fmt(dur));
      }
    } catch (_) {}
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const initPlayer = useCallback(() => {
    if (playerRef.current) return;
    playerRef.current = new window.YT.Player("yt-player-div", {
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
          setReady(true);
          setPlaying(true);
          rafRef.current = requestAnimationFrame(tick);
        },
        onStateChange: (e: any) => {
          setPlaying(e.data === window.YT.PlayerState.PLAYING);
        },
      },
    });
  }, [ytId, tick]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const togglePlay = () => {
    if (!ready || !playerRef.current) return;
    playing ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const skip = (sec: number) => {
    if (!ready || !playerRef.current) return;
    playerRef.current.seekTo(Math.max(0, playerRef.current.getCurrentTime() + sec), true);
  };

  const toggleMute = () => {
    if (!ready || !playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (el.requestFullscreen) {
      el.requestFullscreen();
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ready || !playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    playerRef.current.seekTo(pct * playerRef.current.getDuration(), true);
  };

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:#0a0a0f;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        .page{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:28px 20px}
        .brand{font-size:.82rem;font-weight:700;letter-spacing:.14em;color:#e8ff47;text-transform:uppercase;margin-bottom:28px;text-decoration:none}
        .player-wrap{position:relative;width:100%;max-width:900px;aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.75)}
        .yt-frame{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border:none}
        .overlay{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.1) 50%,transparent 80%);opacity:0;transition:opacity .25s;pointer-events:none}
        .player-wrap:hover .overlay{opacity:1;pointer-events:all}
        .progress-row{display:flex;align-items:center;gap:10px;padding:0 22px 6px}
        .prog-track{flex:1;height:3px;background:rgba(255,255,255,.18);border-radius:2px;cursor:pointer;position:relative}
        .prog-fill{height:100%;background:#e8ff47;border-radius:2px;transition:width .45s linear}
        .t-lbl{font-size:.72rem;color:rgba(255,255,255,.55);font-variant-numeric:tabular-nums;white-space:nowrap}
        .ctrl-row{display:flex;align-items:center;gap:8px;padding:0 22px 18px;flex-wrap:wrap}
        .ctrl-btn{background:rgba(255,255,255,.1);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.14);color:#fff;border-radius:9px;padding:9px 16px;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .18s;font-family:inherit;line-height:1}
        .ctrl-btn:hover{background:#e8ff47;color:#000;border-color:#e8ff47}
        .ctrl-btn.play{background:#e8ff47;color:#000;border-color:#e8ff47;padding:9px 22px}
        .ctrl-spacer{flex:1}
        .info-row{padding:0 22px 14px}
        .vid-title-sm{font-weight:700;font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .info{width:100%;max-width:900px;margin-top:22px}
        .vid-title{font-size:1.45rem;font-weight:700;line-height:1.3;margin-bottom:6px}
        .vid-desc{font-size:.88rem;color:rgba(255,255,255,.45);line-height:1.65}
        .footer{margin-top:44px;font-size:.75rem;color:rgba(255,255,255,.2)}
        .footer a{color:#e8ff47;text-decoration:none}
        @media(max-width:600px){.page{padding:16px 10px}.ctrl-btn{padding:7px 11px;font-size:.76rem}}
      `}</style>

      <div className="page">
        <a className="brand" href="https://edustream.site">EduStream</a>

        <div className="player-wrap" ref={wrapRef}>
          {/* Empty div replaced by YT IFrame API — pointer-events:none blocks native controls */}
          <div id="yt-player-div" className="yt-frame" />

          <div className="overlay">
            <div className="progress-row">
              <span className="t-lbl">{timeCur}</span>
              <div className="prog-track" onClick={seek}>
                <div className="prog-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="t-lbl">{timeTot}</span>
            </div>
            <div className="ctrl-row">
              <button className="ctrl-btn" onClick={() => skip(-15)}>&#8722;15s</button>
              <button className="ctrl-btn play" onClick={togglePlay}>
                {playing ? "\u23F8 Pausa" : "\u25B6 Play"}
              </button>
              <button className="ctrl-btn" onClick={() => skip(15)}>+15s</button>
              <div className="ctrl-spacer" />
              <button className="ctrl-btn" onClick={toggleMute}>
                {muted ? "\uD83D\uDD07 Silencio" : "\uD83D\uDD0A Sonido"}
              </button>
              <button className="ctrl-btn" onClick={toggleFullscreen}>Pantalla completa</button>
            </div>
            <div className="info-row">
              <span className="vid-title-sm">{title}</span>
            </div>
          </div>
        </div>

        <div className="info">
          <h1 className="vid-title">{title}</h1>
          {description && <p className="vid-desc">{description}</p>}
        </div>

        <p className="footer">Powered by <a href="https://edustream.site">EduStream</a></p>
      </div>

      <Script
        src="https://www.youtube.com/iframe_api"
        strategy="afterInteractive"
        onReady={initPlayer}
        onLoad={initPlayer}
      />
    </>
  );
}
