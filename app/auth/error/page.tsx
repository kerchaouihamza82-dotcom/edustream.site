export default function AuthErrorPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        padding: "24px",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-body)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-head)",
          fontSize: "1.4rem",
          fontWeight: 700,
        }}
      >
        Error de autenticación
      </div>
      <p style={{ color: "var(--muted)", maxWidth: "360px", fontSize: "0.9rem" }}>
        Ha ocurrido un error durante la autenticación. Por favor, inténtalo de nuevo.
      </p>
      <a
        href="/auth/login"
        style={{
          background: "var(--accent)",
          color: "#0a0a0f",
          borderRadius: "var(--radius)",
          padding: "12px 28px",
          fontWeight: 700,
          fontSize: "0.9rem",
          textDecoration: "none",
        }}
      >
        Volver al inicio de sesión
      </a>
    </div>
  );
}
