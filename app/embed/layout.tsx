export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
        `}</style>
      </head>
      <body style={{ width: "100%", height: "100%", overflow: "hidden", background: "#000" }}>
        {children}
      </body>
    </html>
  );
}
