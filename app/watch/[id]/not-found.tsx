export default function NotFound() {
  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:#0a0a0f;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        .page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px 20px;text-align:center}
        .brand{font-size:.85rem;font-weight:700;letter-spacing:.12em;color:#47d4ff;text-transform:uppercase;text-decoration:none}
        .code{font-size:5rem;font-weight:800;line-height:1;color:rgba(255,255,255,.08)}
        .msg{font-size:1.2rem;font-weight:600}
        .sub{font-size:.9rem;color:rgba(255,255,255,.4);max-width:360px;line-height:1.5}
      `}</style>
      <div className="page">
        <a className="brand" href="https://edustream.site">EduStream</a>
        <div className="code">404</div>
        <p className="msg">Video no encontrado</p>
        <p className="sub">El enlace puede haber expirado o el video fue eliminado de la plataforma.</p>
      </div>
    </>
  );
}
