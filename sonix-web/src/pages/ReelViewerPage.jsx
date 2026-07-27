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
      <div className="snx-app">
        <Header />
        <div className="snx-reel__loader">
          <div className="snx-reel__loader-spinner" />
        </div>
      </div>
    );
  }

  if (!reel) {
    return (
      <div className="snx-app">
        <Header />
        <div className="snx-reel__not-found">Reel not found</div>
      </div>
    );
  }

  return (
    <div className="snx-app">
      <Header />
      <div className="snx-reel">
        <div className="snx-reel__container">
          <div className="snx-reel__player">
            {reel.video_url && (
              <video src={reel.video_url} controls autoPlay playsInline loop poster={reel.thumbnail_url} />
            )}
          </div>
          <div className="snx-reel__sidebar">
            <div className="snx-reel__user">
              {reel.user?.avatar_url && (
                <img className="snx-reel__user-avatar" src={reel.user.avatar_url} alt={reel.user.username} />
              )}
              <span className="snx-reel__user-name">{reel.user?.username || "Unknown"}</span>
            </div>
            {reel.caption && <p className="snx-reel__caption">{reel.caption}</p>}
            {reel.music_title && (
              <div className="snx-reel__music"><span>&#9835;</span> {reel.music_title}</div>
            )}
            <div className="snx-reel__stats">
              <span className="snx-reel__stat">&#9825; {reel.likes_count || 0}</span>
              <span className="snx-reel__stat">&#9711; {reel.views_count || 0} views</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
