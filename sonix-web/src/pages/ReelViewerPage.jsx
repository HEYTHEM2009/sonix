import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import Header from "../components/Header";

export default function ReelViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reel, setReel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/reels/${id}`)
      .then((res) => setReel(res.data?.data || res.data?.reel || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "#000", minHeight: "100vh" }}>
        <Header />
        <div style={{ display: "flex", justifyContent: "center", padding: 60, paddingTop: 100 }}>
          <div style={{
            width: 32, height: 32, border: "3px solid #333",
            borderTopColor: "#0095f6", borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }} />
        </div>
      </div>
    );
  }

  if (!reel) {
    return (
      <div style={{ background: "#000", minHeight: "100vh" }}>
        <Header />
        <div style={{ color: "#fff", textAlign: "center", paddingTop: 100, fontSize: 18 }}>Reel not found</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <Header />
      <div style={{
        maxWidth: 935, margin: "0 auto", padding: "80px 20px 20px",
        display: "flex", gap: 24, alignItems: "flex-start"
      }}>
        <div style={{ flex: "0 0 auto", width: "min(65vh, 468px)", aspectRatio: "9/16", background: "#111", borderRadius: 4, overflow: "hidden" }}>
          <video src={reel.video_url} controls autoPlay style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1, color: "#fff", maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <img src={reel.user?.avatar || `https://ui-avatars.com/api/?name=${reel.user?.username}&background=6366f1&color=fff`}
              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} alt="" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{reel.user?.username || "Unknown"}</span>
          </div>
          {reel.caption && <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 16px", color: "#ccc" }}>{reel.caption}</p>}
          {reel.music_title && (
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>🎵 {reel.music_title}</p>
          )}
          <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
            <div style={{ textAlign: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <div style={{ fontSize: 13, marginTop: 4 }}>{reel.likes_count || 0}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M21 6h-2v2h-2V6h-2V4h2V2h2v2h2v2zm-10 3c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 4c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              <div style={{ fontSize: 13, marginTop: 4 }}>{reel.views_count || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
