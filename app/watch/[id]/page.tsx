import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select("title, description, youtube_id")
    .eq("id", id)
    .single();

  const title = data?.title ?? "EduStream";
  const description = data?.description ?? "Video educativo en EduStream";
  const thumbnail = data?.youtube_id
    ? `https://img.youtube.com/vi/${data.youtube_id}/maxresdefault.jpg`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://edustream.site/watch/${id}`,
      siteName: "EduStream",
      type: "video.other",
      ...(thumbnail ? { images: [{ url: thumbnail, width: 1280, height: 720, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(thumbnail ? { images: [thumbnail] } : {}),
    },
  };
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: video } = await supabase
    .from("videos")
    .select("id, title, description, youtube_id, slug")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!video) notFound();

  const ytId = video.youtube_id;
  const title = video.title;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:#0a0a0f;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow-x:hidden}
        .page{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:28px 20px}
        .brand{font-size:.82rem;font-weight:700;letter-spacing:.14em;color:#e8ff47;text-transform:uppercase;margin-bottom:28px;text-decoration:none}
        #player-wrap{position:relative;width:100%;max-width:900px;aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.75);user-select:none}
        #yt-player{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border:none}
        .overlay{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.15) 45%,transparent 75%);opacity:0;transition:opacity .25s}
        #player-wrap:hover .overlay{opacity:1}
        .progress-row{display:flex;align-items:center;gap:10px;padding:0 22px 6px}
        .prog-track{flex:1;height:3px;background:rgba(255,255,255,.18);border-radius:2px;cursor:pointer;position:relative}
        .prog-fill{height:100%;background:#e8ff47;border-radius:2px;transition:width .45s linear;width:0%}
        .t-lbl{font-size:.72rem;color:rgba(255,255,255,.55);font-variant-numeric:tabular-nums;white-space:nowrap}
        .ctrl-row{display:flex;align-items:center;gap:8px;padding:0 22px 18px;flex-wrap:wrap}
        .ctrl-btn{background:rgba(255,255,255,.1);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.14);color:#fff;border-radius:9px;padding:9px 16px;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:5px;font-family:inherit}
        .ctrl-btn:hover{background:#e8ff47;color:#000;border-color:#e8ff47}
        .ctrl-btn.play{background:#e8ff47;color:#000;border-color:#e8ff47;padding:9px 20px}
        .ctrl-btn.play:hover{filter:brightness(1.08)}
        .ctrl-spacer{flex:1}
        .info-row{padding:0 22px 14px;display:flex;align-items:center;justify-content:space-between}
        .vid-title-sm{font-weight:700;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .info{width:100%;max-width:900px;margin-top:22px}
        .vid-title{font-size:1.45rem;font-weight:700;line-height:1.3;margin-bottom:6px}
        .vid-desc{font-size:.88rem;color:rgba(255,255,255,.45);line-height:1.65}
        .footer{margin-top:44px;font-size:.75rem;color:rgba(255,255,255,.2)}
        .footer a{color:#e8ff47;text-decoration:none}
        @media(max-width:600px){.page{padding:16px 10px}.ctrl-btn{padding:8px 12px;font-size:.78rem}}
      `}</style>

      <div className="page">
        <a className="brand" href="https://edustream.site">EduStream</a>

        <div id="player-wrap">
          {/* YouTube IFrame — pointer-events:none bloquea todos los controles nativos */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <iframe
            id="yt-player"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&origin=https://edustream.site`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={title}
          />

          {/* Overlay con controles personalizados */}
          <div className="overlay" id="player-overlay">
            <div className="progress-row">
              <span className="t-lbl" id="t-cur">0:00</span>
              <div className="prog-track" id="prog-track">
                <div className="prog-fill" id="prog-fill" />
              </div>
              <span className="t-lbl" id="t-tot">0:00</span>
            </div>
            <div className="ctrl-row">
              <button className="ctrl-btn" id="btn-back">&#8722;15s</button>
              <button className="ctrl-btn play" id="btn-play">&#9654; Play</button>
              <button className="ctrl-btn" id="btn-fwd">+15s</button>
              <div className="ctrl-spacer" />
              <button className="ctrl-btn" id="btn-mute">&#128266; Sonido</button>
              <button className="ctrl-btn" id="btn-fs">Pantalla completa</button>
            </div>
            <div className="info-row">
              <span className="vid-title-sm">{title}</span>
            </div>
          </div>
        </div>

        <div className="info">
          <h1 className="vid-title">{title}</h1>
          {video.description && <p className="vid-desc">{video.description}</p>}
        </div>

        <p className="footer">Powered by <a href="https://edustream.site">EduStream</a></p>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var player, ready = false, playing = false, muted = false;
          var progFill = document.getElementById('prog-fill');
          var tCur = document.getElementById('t-cur');
          var tTot = document.getElementById('t-tot');
          var btnPlay = document.getElementById('btn-play');
          var btnMute = document.getElementById('btn-mute');
          var progTrack = document.getElementById('prog-track');
          var wrap = document.getElementById('player-wrap');

          function fmt(s) {
            s = Math.floor(s || 0);
            var m = Math.floor(s / 60), sec = s % 60;
            return m + ':' + (sec < 10 ? '0' : '') + sec;
          }

          window.onYouTubeIframeAPIReady = function() {
            player = new YT.Player('yt-player', {
              events: {
                onReady: function() {
                  ready = true;
                  playing = true;
                  tick();
                },
                onStateChange: function(e) {
                  playing = (e.data === YT.PlayerState.PLAYING);
                  btnPlay.innerHTML = playing ? '&#9646;&#9646; Pausa' : '&#9654; Play';
                }
              }
            });
          };

          document.getElementById('btn-play').addEventListener('click', function() {
            if (!ready) return;
            playing ? player.pauseVideo() : player.playVideo();
          });

          document.getElementById('btn-back').addEventListener('click', function() {
            if (!ready) return;
            player.seekTo(Math.max(0, player.getCurrentTime() - 15), true);
          });

          document.getElementById('btn-fwd').addEventListener('click', function() {
            if (!ready) return;
            player.seekTo(player.getCurrentTime() + 15, true);
          });

          document.getElementById('btn-mute').addEventListener('click', function() {
            if (!ready) return;
            muted = !muted;
            muted ? player.mute() : player.unMute();
            btnMute.innerHTML = muted ? '&#128264; Silencio' : '&#128266; Sonido';
          });

          document.getElementById('btn-fs').addEventListener('click', function() {
            if (wrap.requestFullscreen) wrap.requestFullscreen();
            else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
          });

          progTrack.addEventListener('click', function(e) {
            if (!ready) return;
            var rect = progTrack.getBoundingClientRect();
            var pct = (e.clientX - rect.left) / rect.width;
            player.seekTo(pct * player.getDuration(), true);
          });

          function tick() {
            if (!ready) return;
            try {
              var cur = player.getCurrentTime(), dur = player.getDuration();
              if (dur > 0) {
                progFill.style.width = ((cur / dur) * 100) + '%';
                tCur.textContent = fmt(cur);
                tTot.textContent = fmt(dur);
              }
            } catch(e) {}
            requestAnimationFrame(tick);
          }

          var tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        })();
      ` }} />
    </>
  );
}
