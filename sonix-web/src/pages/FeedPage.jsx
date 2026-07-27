import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import Header from "../components/Header";

export default function FeedPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    client.get("/reels?trending=1")
      .then((res) => {
        const data = res.data?.data || res.data?.reels || [];
        setReels(Array.isArray(data) ? data : data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="snx-app">
      <Header />
      <div className="snx-feed">
        {loading ? (
          <div className="snx-feed__grid">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="snx-feed__placeholder" />
            ))}
          </div>
        ) : (
          <div className="snx-feed__grid">
            {reels.map((reel) => (
              <div key={reel.id} className="snx-feed__reel" onClick={() => navigate(`/reel/${reel.id}`)}>
                {reel.thumbnail_url ? (
                  <img src={reel.thumbnail_url} alt={reel.caption || "Reel"} loading="lazy" />
                ) : (
                  <video src={reel.video_url} muted loading="lazy" />
                )}
                <div className="snx-feed__reel-info">
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
