import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("videos").select("title, description").eq("id", id).single();
  return {
    title: data?.title ?? "EduStream",
    description: data?.description ?? "Video educativo en EduStream",
    openGraph: {
      title: data?.title ?? "EduStream",
      description: data?.description ?? "Video educativo en EduStream",
      images: data ? [`https://img.youtube.com/vi/${id}/maxresdefault.jpg`] : [],
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

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:#0a0a0f;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        .page{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:32px 20px}
        .brand{font-size:.85rem;font-weight:700;letter-spacing:.12em;color:#47d4ff;text-transform:uppercase;margin-bottom:32px;text-decoration:none}
        .player-wrap{width:100%;max-width:900px;aspect-ratio:16/9;background:#000;border-radius:16px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.7)}
        .player-wrap iframe{width:100%;height:100%;border:none;display:block}
        .info{width:100%;max-width:900px;margin-top:24px}
        .title{font-size:1.5rem;font-weight:700;line-height:1.3;margin-bottom:8px}
        .desc{font-size:.9rem;color:rgba(255,255,255,.5);line-height:1.6}
        .footer{margin-top:48px;font-size:.78rem;color:rgba(255,255,255,.25)}
        .footer a{color:#47d4ff;text-decoration:none}
        @media(max-width:600px){.page{padding:20px 12px}.title{font-size:1.2rem}}
      `}</style>
      <div className="page">
        <a className="brand" href="https://edustream.site">EduStream</a>
        <div className="player-wrap">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={video.title}
          />
        </div>
        <div className="info">
          <h1 className="title">{video.title}</h1>
          {video.description && <p className="desc">{video.description}</p>}
        </div>
        <p className="footer">Powered by <a href="https://edustream.site">EduStream</a></p>
      </div>
    </>
  );
}
