import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduStream — Plataforma de Cursos",
  description: "Comparte y organiza tus cursos en video con tu propio reproductor personalizado.",
  metadataBase: new URL("https://edustream.site"),
  openGraph: {
    title: "EduStream — Plataforma de Cursos",
    description: "Comparte y organiza tus cursos en video con tu propio reproductor personalizado.",
    url: "https://edustream.site",
    siteName: "EduStream",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduStream — Plataforma de Cursos",
    description: "Comparte y organiza tus cursos en video con tu propio reproductor personalizado.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
