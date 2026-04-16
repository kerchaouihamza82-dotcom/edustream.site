"use client";

import { useState } from "react";
import { loginAction } from "./action";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        .auth-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #0a0a0f;
        }
        .auth-card {
          background: #111118;
          border: 1px solid #1e1e2a;
          border-radius: 16px;
          padding: 40px 36px;
          width: 100%;
          max-width: 400px;
        }
        .auth-logo {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-family: sans-serif;
        }
        .auth-logo span { color: #e8ff47; }
        .auth-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #e8ff47; flex-shrink: 0;
        }
        .auth-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
          font-family: sans-serif;
        }
        .auth-sub {
          font-size: 0.88rem;
          color: #666;
          margin-bottom: 28px;
          font-family: sans-serif;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 16px;
        }
        .form-label {
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #888;
          font-family: sans-serif;
        }
        .form-input {
          background: #0d0d14;
          border: 1px solid #1e1e2a;
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 0.95rem;
          color: #fff;
          outline: none;
          width: 100%;
          transition: border-color 0.2s;
          font-family: sans-serif;
        }
        .form-input:focus { border-color: #e8ff47; }
        .form-input::placeholder { color: #444; }
        .auth-error {
          background: rgba(255,80,80,0.08);
          border: 1px solid rgba(255,80,80,0.2);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 0.88rem;
          color: #ff6b6b;
          margin-bottom: 16px;
          font-family: sans-serif;
        }
        .auth-btn {
          width: 100%;
          padding: 14px;
          background: #e8ff47;
          color: #0a0a0f;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 4px;
          font-family: sans-serif;
        }
        .auth-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-dot" />
            Edu<span>Stream</span>
          </div>

          <div className="auth-title">Acceso privado</div>
          <div className="auth-sub">Introduce tus credenciales para continuar.</div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                className="form-input"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                required
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
