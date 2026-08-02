import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import Header from "../components/Header";

export default function ExplorePage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Explore — Sonix";
    Promise.all([
      client.get("/reels?trending=1").catch(() => ({ data: { data: [] } })),
      client.get("/reels").catch(() => ({ data: { data: [] } })),
    ])
      .then(([trending, all]) => {
        const t = trending.data?.data || trending.data?.reels || trending.data || [];
        const a = all.data?.data || all.data?.reels || all.data || [];
        const tArr = Array.isArray(t) ? t : t?.data || [];
        const aArr = Array.isArray(a) ? a : a?.data || [];
        const merged = [...new Map([...aArr, ...tArr].map((r) => [r && r.id, r])).values()];
        setReels(merged);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="snx-app">
      <Header />
      <div className="snx-explore">
        <h2 className="snx-explore__title">Explore</h2>
        {loading ? (
          <div className="snx-explore__grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="snx-explore__placeholder" />
            ))}
          </div>
        ) : error ? (
          <p className="snx-feed__empty">Failed to load explore. Try again later.</p>
        ) : reels.length === 0 ? (
          <p className="snx-feed__empty">Nothing to explore yet.</p>
        ) : (
          <div className="snx-explore__grid">
            {reels.map((reel) => (
              <div
                key={reel.id}
                className="snx-explore__reel"
                onClick={() => navigate(`/reel/${reel.id}`)}
              >
                {reel.thumbnail_url ? (
                  <img src={reel.thumbnail_url} alt={reel.caption || "Reel"} loading="lazy" />
                ) : (
                  <video src={reel.video_url} muted />
                )}
                <div className="snx-explore__reel-info">
                  <span>&#9825; {reel.likes_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
