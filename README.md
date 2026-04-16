<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EduStream — Plataforma de Cursos</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />
  <style>
    /* ─── CSS Variables ─────────────────────────────────── */
    :root {
      --bg:        #0a0a0f;
      --surface:   #111118;
      --card:      #16161f;
      --border:    rgba(255,255,255,0.07);
      --accent:    #e8ff47;
      --accent2:   #47d4ff;
      --danger:    #ff5c5c;
      --text:      #f0f0f0;
      --muted:     #6b6b80;
      --radius:    12px;
      --radius-lg: 20px;
      --font-head: 'Syne', sans-serif;
      --font-body: 'DM Sans', sans-serif;
      --shadow:    0 20px 60px rgba(0,0,0,0.6);
      --glow:      0 0 30px rgba(232,255,71,0.15);
    }

    /* ─── Reset ─────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--font-body);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ─── Noise texture overlay ──────────────────────────── */
    body::before {
      content: '';
      position: fixed; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
      pointer-events: none; z-index: 0; opacity: 0.4;
    }

    /* ─── Layout ─────────────────────────────────────────── */
    .app { position: relative; z-index: 1; }

    /* ─── Header ─────────────────────────────────────────── */
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
    .nav-tabs {
      display: flex; gap: 4px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 4px;
    }
    .nav-tab {
      padding: 8px 20px;
      border-radius: 7px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-family: var(--font-body);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-tab.active { background: var(--card); color: var(--text); }
    .nav-tab:hover:not(.active) { color: var(--text); }

    /* ─── Main content ───────────────────────────────────── */
    main { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }

    /* ─── Section heading ────────────────────────────────── */
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

    /* ─── Card ───────────────────────────────────────────── */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
      opacity: 0.4;
    }

    /* ─── Form elements ──────────────────────────────────── */
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
      font-family: var(--font-body);
      font-size: 0.95rem;
      color: var(--text);
      transition: all 0.2s; outline: none; width: 100%;
    }
    input[type="text"]:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(232,255,71,0.08);
    }
    input[type="text"]::placeholder { color: var(--muted); }

    /* ─── Buttons ────────────────────────────────────────── */
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 8px; padding: 13px 24px;
      border-radius: var(--radius); border: none;
      font-family: var(--font-body); font-weight: 600; font-size: 0.9rem;
      cursor: pointer; transition: all 0.2s; white-space: nowrap;
      text-decoration: none;
    }
    .btn-primary {
      background: var(--accent); color: #0a0a0f;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: var(--glow); filter: brightness(1.05); }
    .btn-primary:active { transform: translateY(0); }
    .btn-ghost {
      background: var(--surface); color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
    .btn-danger {
      background: rgba(255,92,92,0.1); color: var(--danger);
      border: 1px solid rgba(255,92,92,0.2);
    }
    .btn-danger:hover { background: rgba(255,92,92,0.2); }
    .btn-sm { padding: 8px 14px; font-size: 0.8rem; border-radius: 8px; }
    .btn-icon { padding: 10px; border-radius: 8px; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 24px; }

    /* ─── Generated link box ─────────────────────────────── */
    .link-result {
      margin-top: 24px;
      background: var(--surface);
      border: 1px solid var(--accent);
      border-radius: var(--radius);
      padding: 16px 20px;
      display: none;
      animation: slideIn 0.3s ease;
    }
    .link-result.show { display: block; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .link-result-label {
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--accent); font-weight: 600; margin-bottom: 10px;
    }
    .link-copy-row {
      display: flex; gap: 10px; align-items: center;
    }
    .link-url {
      flex: 1;
      font-family: monospace; font-size: 0.85rem;
      background: var(--bg); padding: 10px 14px;
      border-radius: 8px; border: 1px solid var(--border);
      color: var(--accent2);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* ─── Video Library ──────────────────────────────────── */
    .library-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    .library-search {
      display: flex; align-items: center; gap: 10px;
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 10px 16px; flex: 1; max-width: 300px;
    }
    .library-search input {
      background: none; border: none; outline: none;
      font-family: var(--font-body); font-size: 0.9rem; color: var(--text); width: 100%;
    }
    .library-search input::placeholder { color: var(--muted); }
    .library-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
    .empty-state {
      text-align: center; padding: 80px 20px;
      color: var(--muted);
    }
    .empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.4; }
    .empty-text { font-size: 0.9rem; }

    /* ─── Player Section ─────────────────────────────────── */
    #player-view { display: none; }
    #player-view.show { display: block; }
    .player-back {
      display: inline-flex; align-items: center; gap: 8px;
      color: var(--muted); font-size: 0.9rem; cursor: pointer;
      margin-bottom: 24px; transition: color 0.2s; background: none; border: none;
      font-family: var(--font-body);
    }
    .player-back:hover { color: var(--accent); }
    .player-wrap {
      background: #000;
      border-radius: var(--radius-lg);
      overflow: hidden;
      position: relative;
      aspect-ratio: 16/9;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    .player-wrap iframe {
      position: absolute; inset: 0; width: 100%; height: 100%;
      border: none;
    }
    /* Custom overlay */
    .player-overlay {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      justify-content: flex-end;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 70%);
      opacity: 0; transition: opacity 0.3s; z-index: 5;
    }
    .player-wrap:hover .player-overlay { opacity: 1; }
    .player-controls {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 24px;
    }
    .ctrl-btn {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.15);
      color: white;
      border-radius: 10px;
      padding: 10px 18px;
      font-family: var(--font-body);
      font-weight: 600; font-size: 0.85rem;
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; gap: 6px;
    }
    .ctrl-btn:hover {
      background: var(--accent); color: #000;
      border-color: var(--accent);
    }
    .ctrl-btn.play-pause {
      background: var(--accent); color: #000;
      border-color: var(--accent);
      padding: 10px 22px;
    }
    .ctrl-btn.play-pause:hover { filter: brightness(1.1); }
    .ctrl-spacer { flex: 1; }
    .player-info {
      padding: 0 24px 16px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .now-playing-label {
      font-size: 0.7rem; text-transform: uppercase;
      letter-spacing: 0.12em; color: var(--accent);
      font-weight: 600;
    }
    .now-playing-title {
      font-family: var(--font-head); font-weight: 700; font-size: 1.1rem;
    }

    /* Progress bar */
    .progress-bar-wrap {
      padding: 0 24px 4px;
      display: flex; align-items: center; gap: 12px;
    }
    .progress-track {
      flex: 1; height: 3px;
      background: rgba(255,255,255,0.2);
      border-radius: 2px; cursor: pointer;
      position: relative;
    }
    .progress-fill {
      height: 100%; background: var(--accent);
      border-radius: 2px; transition: width 0.5s linear;
      width: 0%;
    }
    .time-label {
      font-size: 0.75rem; color: rgba(255,255,255,0.6);
      font-family: monospace; white-space: nowrap;
    }

    /* Below player */
    .player-meta {
      margin-top: 24px;
      display: grid; grid-template-columns: 1fr auto; gap: 20px;
      align-items: start;
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

    /* ─── Toast ──────────────────────────────────────────── */
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
      animation: toastIn 0.3s ease, toastOut 0.3s ease 2.5s forwards;
      max-width: 320px;
    }
    .toast.success { border-color: rgba(232,255,71,0.4); }
    .toast.error   { border-color: rgba(255,92,92,0.4); }
    .toast-icon { font-size: 1rem; }
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(10px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to   { opacity: 0; transform: translateY(-6px) scale(0.95); }
    }

    /* ─── Badge ──────────────────────────────────────────── */
    .badge {
      display: inline-block;
      background: rgba(232,255,71,0.12);
      color: var(--accent);
      border: 1px solid rgba(232,255,71,0.25);
      border-radius: 6px;
      padding: 3px 9px;
      font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.05em; text-transform: uppercase;
    }

    /* ─── Divider ────────────────────────────────────────── */
    .divider { height: 1px; background: var(--border); margin: 36px 0; }

    /* ─── Stats row ──────────────────────────────────────── */
    .stats-row {
      display: flex; gap: 24px; margin-bottom: 32px; flex-wrap: wrap;
    }
    .stat-pill {
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 12px 20px;
      display: flex; align-items: center; gap: 10px;
    }
    .stat-num {
      font-family: var(--font-head); font-weight: 700; font-size: 1.4rem;
      color: var(--accent);
    }
    .stat-desc { font-size: 0.8rem; color: var(--muted); }

    /* ─── Responsive ─────────────────────────────────────── */
    @media (max-width: 768px) {
      header { padding: 16px 20px; }
      main   { padding: 24px 16px; }
      .card  { padding: 20px; }
      .player-controls { flex-wrap: wrap; gap: 8px; }
      .nav-tabs { display: none; }
    }
  </style>
</head>
<body>
<div class="app">

  <!-- ─── Header ───────────────────────────────────────── -->
  <header>
    <div class="logo">
      <div class="logo-dot"></div>
      Edu<span>Stream</span>
    </div>
    <div class="nav-tabs">
      <button class="nav-tab active" onclick="showView('add')">+ Añadir Video</button>
      <button class="nav-tab" onclick="showView('library')">Biblioteca</button>
    </div>
  </header>

  <!-- ─── Main ─────────────────────────────────────────── -->
  <main>

    <!-- ══ ADD VIDEO VIEW ══════════════════════════════════ -->
    <div id="add-view">
      <div class="section-label">Panel de administración</div>
      <div class="section-title">Añadir nuevo video</div>

      <div class="card">
        <div class="input-row">
          <div class="input-group full">
            <label>Enlace de YouTube</label>
            <input type="text" id="yt-url" placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..." />
          </div>
          <div class="input-group">
            <label>Título del curso / clase</label>
            <input type="text" id="yt-title" placeholder="Ej: Introducción a JavaScript — Clase 1" />
          </div>
          <div class="input-group">
            <label>Categoría (opcional)</label>
            <input type="text" id="yt-category" placeholder="Ej: Programación, Diseño, Marketing…" />
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-primary" onclick="addVideo()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Añadir a la plataforma
          </button>
          <button class="btn btn-ghost" onclick="clearForm()">Limpiar</button>
        </div>

        <!-- Generated link -->
        <div class="link-result" id="link-result">
          <div class="link-result-label">✓ Enlace de plataforma generado</div>
          <div class="link-copy-row">
            <div class="link-url" id="link-url-display"></div>
            <button class="btn btn-ghost btn-sm" onclick="copyGeneratedLink()">Copiar</button>
            <button class="btn btn-primary btn-sm" onclick="playGeneratedVideo()">▶ Ver</button>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="section-label">Información</div>
      <div class="section-title">¿Cómo funciona?</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px">
        <div class="card" style="padding:20px">
          <div style="font-size:1.6rem;margin-bottom:12px">🔗</div>
          <div style="font-family:var(--font-head);font-weight:600;margin-bottom:6px">Enlace propio</div>
          <div style="font-size:0.85rem;color:var(--muted);line-height:1.6">Cuando alguien abre el enlace compartido, ve tu plataforma — no el canal de YouTube directamente.</div>
        </div>
        <div class="card" style="padding:20px">
          <div style="font-size:1.6rem;margin-bottom:12px">🎬</div>
          <div style="font-family:var(--font-head);font-weight:600;margin-bottom:6px">Reproductor personalizado</div>
          <div style="font-size:0.85rem;color:var(--muted);line-height:1.6">Overlay con Play/Pause, retroceder 15s, avanzar 15s y pantalla completa. Todo con tu estética.</div>
        </div>
        <div class="card" style="padding:20px">
          <div style="font-size:1.6rem;margin-bottom:12px">🔒</div>
          <div style="font-family:var(--font-head);font-weight:600;margin-bottom:6px">Videos privados</div>
          <div style="font-size:0.85rem;color:var(--muted);line-height:1.6">Funciona con videos no listados o privados de YouTube siempre que tengas el enlace directo.</div>
        </div>
        <div class="card" style="padding:20px">
          <div style="font-size:1.6rem;margin-bottom:12px">📦</div>
          <div style="font-family:var(--font-head);font-weight:600;margin-bottom:6px">Biblioteca local</div>
          <div style="font-size:0.85rem;color:var(--muted);line-height:1.6">Todos tus videos se guardan en el navegador. Para producción, conecta un backend y una base de datos.</div>
        </div>
      </div>
    </div>

    <!-- ══ LIBRARY VIEW ════════════════════════════════════ -->
    <div id="library-view" style="display:none">
      <div id="lib-stats" class="stats-row"></div>

      <div class="library-header">
        <div>
          <div class="section-label">Tu colección</div>
          <div class="section-title" style="margin-bottom:0">Biblioteca de videos</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div class="library-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted);flex-shrink:0"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Buscar video…" oninput="filterVideos(this.value)" />
          </div>
          <button class="btn btn-ghost btn-sm" onclick="showView('add')">+ Añadir</button>
        </div>
      </div>

      <div class="library-grid" id="library-grid"></div>
    </div>

    <!-- ══ PLAYER VIEW ═════════════════════════════════════ -->
    <div id="player-view">
      <button class="player-back" onclick="backToLibrary()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Volver a la biblioteca
      </button>

      <div class="player-wrap" id="player-wrap">
        <div id="yt-player"></div>

        <!-- Overlay controls -->
        <div class="player-overlay" id="player-overlay">
          <div class="progress-bar-wrap">
            <span class="time-label" id="time-current">0:00</span>
            <div class="progress-track" id="progress-track" onclick="seekFromBar(event)">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
            <span class="time-label" id="time-total">0:00</span>
          </div>
          <div class="player-controls">
            <button class="ctrl-btn" onclick="skipTime(-15)" title="-15 segundos">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>
              −15s
            </button>
            <button class="ctrl-btn play-pause" id="play-btn" onclick="togglePlay()">⏵ Play</button>
            <button class="ctrl-btn" onclick="skipTime(15)" title="+15 segundos">
              +15s
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M20.49 15A9 9 0 1 1 20 10"/></svg>
            </button>
            <div class="ctrl-spacer"></div>
            <button class="ctrl-btn" onclick="toggleMute()" id="mute-btn">🔊 Sonido</button>
            <button class="ctrl-btn" onclick="toggleFullscreen()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              Pantalla completa
            </button>
          </div>
          <div class="player-info">
            <div>
              <div class="now-playing-label">Reproduciendo ahora</div>
              <div class="now-playing-title" id="now-playing-title">—</div>
            </div>
            <div class="badge" id="now-playing-cat"></div>
          </div>
        </div>
      </div>

      <!-- Meta + share -->
      <div class="player-meta">
        <div>
          <div class="section-label" style="margin-top:24px">Detalles del video</div>
          <div style="font-family:var(--font-head);font-size:1.4rem;font-weight:700;margin-bottom:8px" id="player-title-big">—</div>
          <div style="font-size:0.85rem;color:var(--muted)" id="player-date-added">—</div>
        </div>
        <div class="player-share-card" style="min-width:260px">
          <div class="share-label">Compartir enlace de plataforma</div>
          <div class="link-copy-row">
            <div class="link-url" id="player-share-link" style="font-size:0.8rem">—</div>
            <button class="btn btn-ghost btn-sm" onclick="copyPlayerLink()">Copiar</button>
          </div>
        </div>
      </div>
    </div>

  </main>
</div>

<!-- ─── Toast container ───────────────────────────── -->
<div class="toast-container" id="toast-container"></div>

<!-- ─── YouTube IFrame API ────────────────────────── -->
<script src="https://www.youtube.com/iframe_api"></script>
<script>
/* ════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════ */
let ytPlayer       = null;
let ytReady        = false;
let currentVideoId = null;   // YouTube video ID
let currentEntry   = null;   // full storage entry
let progressTimer  = null;
let isMuted        = false;
let isPlaying      = false;

const DB_KEY = 'edustream_videos';

/* ════════════════════════════════════════════════════
   STORAGE HELPERS
════════════════════════════════════════════════════ */
function loadDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); } catch { return []; }
}
function saveDB(arr) {
  localStorage.setItem(DB_KEY, JSON.stringify(arr));
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/* ════════════════════════════════════════════════════
   YOUTUBE UTILS
════════════════════════════════════════════════════ */
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([^&?#\s]{11})/,
    /youtube\.com\/watch\?.*v=([^&\s]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

function thumbUrl(ytId) {
  return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
}

function platformLink(entryId) {
  return `${location.origin}${location.pathname}?v=${entryId}`;
}

/* ════════════════════════════════════════════════════
   TOAST
════════════════════════════════════════════════════ */
function toast(msg, type = 'success') {
  const icon = type === 'success' ? '✓' : '✕';
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icon}</span>${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* ════════════════════════════════════════════════════
   VIEW SWITCHING
════════════════════════════════════════════════════ */
function showView(v) {
  document.getElementById('add-view').style.display     = v === 'add'     ? 'block' : 'none';
  document.getElementById('library-view').style.display = v === 'library' ? 'block' : 'none';
  document.getElementById('player-view').style.display  = v === 'player'  ? 'block' : 'none';

  document.querySelectorAll('.nav-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && v === 'add') || (i === 1 && (v === 'library' || v === 'player')));
  });

  if (v === 'library') renderLibrary();
}

function backToLibrary() {
  if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') ytPlayer.pauseVideo();
  clearInterval(progressTimer);
  showView('library');
}

/* ════════════════════════════════════════════════════
   ADD VIDEO
════════════════════════════════════════════════════ */
function addVideo() {
  const url   = document.getElementById('yt-url').value.trim();
  const title = document.getElementById('yt-title').value.trim() || 'Video sin título';
  const cat   = document.getElementById('yt-category').value.trim() || 'Sin categoría';

  if (!url) { toast('Introduce un enlace de YouTube', 'error'); return; }
  const ytId = extractYouTubeId(url);
  if (!ytId) { toast('Enlace de YouTube no válido', 'error'); return; }

  const db = loadDB();

  // Check duplicate
  const exists = db.find(e => e.ytId === ytId);
  if (exists) {
    toast('Este video ya existe en la biblioteca', 'error');
    return;
  }

  const entry = {
    id:       genId(),
    ytId:     ytId,
    title:    title,
    category: cat,
    added:    new Date().toISOString()
  };

  db.unshift(entry);
  saveDB(db);

  // Show generated link
  const link = platformLink(entry.id);
  document.getElementById('link-url-display').textContent = link;
  document.getElementById('link-result').classList.add('show');

  // Store last generated for buttons
  window._lastEntry = entry;

  toast('Video añadido correctamente ✓');
}

function clearForm() {
  document.getElementById('yt-url').value      = '';
  document.getElementById('yt-title').value    = '';
  document.getElementById('yt-category').value = '';
  document.getElementById('link-result').classList.remove('show');
  window._lastEntry = null;
}

function copyGeneratedLink() {
  const link = document.getElementById('link-url-display').textContent;
  navigator.clipboard.writeText(link).then(() => toast('Enlace copiado al portapapeles'));
}

function playGeneratedVideo() {
  if (!window._lastEntry) return;
  openPlayer(window._lastEntry);
  showView('player');
}

/* ════════════════════════════════════════════════════
   LIBRARY
════════════════════════════════════════════════════ */
function renderLibrary(filter = '') {
  const db = loadDB();
  const grid = document.getElementById('library-grid');

  // Stats
  const cats = [...new Set(db.map(e => e.category))].length;
  document.getElementById('lib-stats').innerHTML = `
    <div class="stat-pill"><div class="stat-num">${db.length}</div><div class="stat-desc">Videos totales</div></div>
    <div class="stat-pill"><div class="stat-num">${cats}</div><div class="stat-desc">Categorías</div></div>
  `;

  const filtered = filter
    ? db.filter(e => e.title.toLowerCase().includes(filter.toLowerCase()) || e.category.toLowerCase().includes(filter.toLowerCase()))
    : db;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🎬</div>
      <div class="empty-text">${filter ? 'No se encontraron resultados.' : 'No hay videos aún. ¡Añade el primero!'}</div>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(entry => {
    const date = new Date(entry.added).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
    return `
    <div class="video-card" onclick="openPlayer(${JSON.stringify(entry).replace(/"/g, '&quot;')});showView('player')">
      <div class="video-thumb">
        <img src="${thumbUrl(entry.ytId)}" alt="${entry.title}" loading="lazy" />
        <div class="thumb-play"><div class="thumb-play-icon">▶</div></div>
      </div>
      <div class="video-card-body">
        <div class="video-card-title">${entry.title}</div>
        <div class="video-card-meta">
          <span>${date}</span>
          <span class="badge">${entry.category}</span>
        </div>
      </div>
      <div class="video-card-actions" onclick="event.stopPropagation()">
        <button class="btn btn-ghost btn-sm" onclick="copyLink('${entry.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copiar enlace
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteVideo('${entry.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
          Eliminar
        </button>
      </div>
    </div>`;
  }).join('');
}

function filterVideos(q) {
  renderLibrary(q);
}

function copyLink(entryId) {
  navigator.clipboard.writeText(platformLink(entryId)).then(() => toast('Enlace copiado'));
}

function deleteVideo(entryId) {
  let db = loadDB();
  db = db.filter(e => e.id !== entryId);
  saveDB(db);
  renderLibrary();
  toast('Video eliminado');
}

/* ════════════════════════════════════════════════════
   PLAYER
════════════════════════════════════════════════════ */
function openPlayer(entry) {
  currentEntry   = entry;
  currentVideoId = entry.ytId;

  document.getElementById('now-playing-title').textContent  = entry.title;
  document.getElementById('now-playing-cat').textContent    = entry.category;
  document.getElementById('player-title-big').textContent   = entry.title;
  document.getElementById('player-share-link').textContent  = platformLink(entry.id);

  const date = new Date(entry.added).toLocaleDateString('es-ES', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  document.getElementById('player-date-added').textContent = 'Añadido el ' + date;

  if (!ytReady) {
    // Player will be created once API is ready
    window._pendingVideoId = entry.ytId;
    return;
  }

  if (!ytPlayer) {
    createPlayer(entry.ytId);
  } else {
    ytPlayer.loadVideoById(entry.ytId);
    isPlaying = true;
    updatePlayBtn();
    startProgressTimer();
  }
}

function createPlayer(ytId) {
  if (document.getElementById('yt-player')) {
    ytPlayer = new YT.Player('yt-player', {
      videoId: ytId,
      playerVars: {
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        controls: 0,    // hide native controls — we use our own
        fs: 0,          // hide native fullscreen button
        iv_load_policy: 3
      },
      events: {
        onReady: e => {
          isPlaying = true;
          e.target.playVideo();
          updatePlayBtn();
          startProgressTimer();
        },
        onStateChange: e => {
          isPlaying = e.data === YT.PlayerState.PLAYING;
          updatePlayBtn();
          if (e.data === YT.PlayerState.ENDED) {
            clearInterval(progressTimer);
            document.getElementById('progress-fill').style.width = '100%';
          }
        }
      }
    });
  }
}

/* ── Player controls ──────────────────────────────── */
function togglePlay() {
  if (!ytPlayer) return;
  const state = ytPlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) { ytPlayer.pauseVideo(); isPlaying = false; }
  else { ytPlayer.playVideo(); isPlaying = true; }
  updatePlayBtn();
}

function updatePlayBtn() {
  const btn = document.getElementById('play-btn');
  if (btn) btn.innerHTML = isPlaying ? '⏸ Pausa' : '⏵ Play';
}

function skipTime(secs) {
  if (!ytPlayer) return;
  const t = ytPlayer.getCurrentTime();
  ytPlayer.seekTo(Math.max(0, t + secs), true);
}

function toggleMute() {
  if (!ytPlayer) return;
  isMuted = !isMuted;
  isMuted ? ytPlayer.mute() : ytPlayer.unMute();
  document.getElementById('mute-btn').innerHTML = isMuted ? '🔇 Silencio' : '🔊 Sonido';
}

function toggleFullscreen() {
  const container = document.getElementById('player-wrap');
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => toast('Error pantalla completa: ' + err.message, 'error'));
  } else {
    document.exitFullscreen();
  }
}

function seekFromBar(e) {
  if (!ytPlayer || typeof ytPlayer.getDuration !== 'function') return;
  const rect = document.getElementById('progress-track').getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  ytPlayer.seekTo(ytPlayer.getDuration() * pct, true);
}

/* ── Progress bar ─────────────────────────────────── */
function startProgressTimer() {
  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
    try {
      const cur = ytPlayer.getCurrentTime();
      const dur = ytPlayer.getDuration();
      if (!dur) return;
      document.getElementById('progress-fill').style.width = ((cur / dur) * 100) + '%';
      document.getElementById('time-current').textContent = formatTime(cur);
      document.getElementById('time-total').textContent   = formatTime(dur);
    } catch (_) {}
  }, 500);
}

function formatTime(s) {
  s = Math.floor(s);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2,'0')}:${ss}`;
  }
  return `${m}:${ss}`;
}

function copyPlayerLink() {
  if (!currentEntry) return;
  navigator.clipboard.writeText(platformLink(currentEntry.id)).then(() => toast('Enlace copiado'));
}

/* ════════════════════════════════════════════════════
   YOUTUBE IFrame API READY
════════════════════════════════════════════════════ */
function onYouTubeIframeAPIReady() {
  ytReady = true;
  if (window._pendingVideoId && currentEntry) {
    showView('player');
    createPlayer(window._pendingVideoId);
    window._pendingVideoId = null;
  }
}

/* ════════════════════════════════════════════════════
   DEEP LINK: load from ?v=
════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const vid    = params.get('v');
  if (vid) {
    const db = loadDB();
    const entry = db.find(e => e.id === vid);
    if (entry) {
      openPlayer(entry);
      showView('player');
    } else {
      toast('Video no encontrado en esta plataforma', 'error');
    }
  }
});
</script>
</body>
</html>
