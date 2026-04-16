"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "../actions";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Completa todos los campos.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresa un email válido.");
      return;
    }

    if (mode === "register") {
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await signIn(email, password)
          : await signUp(email, password);

      if (result.error) {
        setError(result.error);
      } else {
        window.location.href = "/dashboard";
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .auth-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: var(--bg);
        }
        .auth-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 40px 36px;
          width: 100%;
          max-width: 420px;
          position: relative;
          overflow: hidden;
        }
        .auth-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0.5;
        }
        .auth-logo {
          font-family: var(--font-head);
          font-weight: 800;
          font-size: 1.6rem;
          letter-spacing: -0.5px;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .auth-logo span { color: var(--accent); }
        .auth-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--accent);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .auth-title {
          font-family: var(--font-head);
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .auth-subtitle {
          font-size: 0.88rem;
          color: var(--muted);
          margin-bottom: 28px;
        }
        .auth-tabs {
          display: flex;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 4px;
        }
        .auth-tab {
          flex: 1;
          padding: 8px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: var(--muted);
          font-family: var(--font-body);
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-tab.active {
          background: var(--card-hover, #1a1a22);
          color: var(--text);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .form-label {
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .form-input {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 13px 16px;
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--text);
          transition: all 0.2s;
          outline: none;
          width: 100%;
        }
        .form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(232,255,71,0.08);
        }
        .form-input::placeholder { color: var(--muted); }
        .form-hint {
          font-size: 0.78rem;
          color: var(--muted);
          margin-top: -4px;
        }
        .auth-error {
          background: rgba(255,92,92,0.08);
          border: 1px solid rgba(255,92,92,0.25);
          border-radius: var(--radius);
          padding: 12px 16px;
          font-size: 0.88rem;
          color: var(--danger);
          margin-bottom: 16px;
        }
        .auth-btn {
          width: 100%;
          padding: 14px;
          background: var(--accent);
          color: #0a0a0f;
          border: none;
          border-radius: var(--radius);
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }
        .auth-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: var(--glow);
        }
        .auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-dot" />
            Edu<span>Stream</span>
          </div>

          <div className="auth-title">
            {mode === "login" ? "Bienvenido de vuelta" : "Crear cuenta"}
          </div>
          <div className="auth-subtitle">
            {mode === "login"
              ? "Inicia sesión para acceder a tu plataforma."
              : "Regístrate para empezar a crear tu biblioteca."}
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab${mode === "login" ? " active" : ""}`}
              onClick={() => { setMode("login"); setError(null); }}
              type="button"
            >
              Iniciar sesión
            </button>
            <button
              className={`auth-tab${mode === "register" ? " active" : ""}`}
              onClick={() => { setMode("register"); setError(null); }}
              type="button"
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="form-input"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                className="form-input"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {mode === "register" && (
                <span className="form-hint">Mínimo 6 caracteres.</span>
              )}
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">
                  Confirmar contraseña
                </label>
                <input
                  id="confirm-password"
                  className="form-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading
                ? "Cargando..."
                : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
