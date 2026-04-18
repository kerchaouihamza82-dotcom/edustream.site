import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LibrarySidebar from "./components/LibrarySidebar";

export const metadata = { title: "Biblioteca — EduStream", description: "Tu biblioteca personal de catálogos y enlaces" };

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif" }}>
      <LibrarySidebar user={user} />
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
