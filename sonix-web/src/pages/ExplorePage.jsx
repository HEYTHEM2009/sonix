import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import Header from "../components/Header";

export default function ExplorePage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      client.get("/reels?trending=1").catch(() => ({ data: { data: [] } })),
      client.get("/reels").catch(() => ({ data: { data: [] } })),
    ])
      .then(([trending, all]) => {
        const t = trending.data?.data || trending.data?.reels || trending.data || [];
        const a = all.data?.data || all.data?.reels || all.data || [];
        const merged = [...new Map([...a, ...t].map((r) => [r.id, r])).values()];
        setReels(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <Header />
      <div style={{ paddingTop: 60 }}>
        <div style={{ maxWidth: 935, margin: "0 auto", padding: "16px 4px" }}>
          <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 600, margin: "0 0 16px 4px" }}>Explore</h2>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <div style={{
                width: 32, height: 32, border: "3px solid #333",
                borderTopColor: "#0095f6", borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }} />
            </div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4
            }}>
              {reels.map((reel) => (
                <div key={reel.id} onClick={() => navigate(`/reel/${reel.id}`)}
                  style={{ position: "relative", cursor: "pointer", aspectRatio: "9/16", overflow: "hidden", background: "#1a1a1a" }}>
                  {reel.thumbnail_url ? (
                    <img src={reel.thumbnail_url} alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <video src={reel.video_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <div style={{
                    position: "absolute", bottom: 8, left: 8,
                    display: "flex", alignItems: "center", gap: 4
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <span style={{ color: "#fff", fontSize: 12 }}>{reel.likes_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
