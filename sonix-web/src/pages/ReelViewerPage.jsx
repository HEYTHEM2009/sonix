import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function ReelViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reel, setReel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const toggleLike = async () => {
    const wasLiked = liked;
    const wasCount = likesCount;
    setLiked(!liked);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    try {
      await client.post(`/reels/${id}/like`);
    } catch {
      setLiked(wasLiked);
      setLikesCount(wasCount);
    }
  };

  const toggleSave = async () => {
    const wasSaved = saved;
    setSaved(!saved);
    try {
      await client.post(`/reels/${id}/save`);
    } catch {
      setSaved(wasSaved);
    }
  };

  useEffect(() => {
    document.title = "Reel — Sonix";
    client
      .get(`/reels/${id}`)
      .then((res) => {
        const data = res.data?.data || res.data?.reel || res.data;
        if (!data || !data.id) {
          setError("NOT_FOUND");
          return;
        }
        setReel(data);
        setLiked(!!data.is_liked || !!data.liked_by_user);
        setSaved(!!data.is_saved || !!data.saved_by_user);
        setLikesCount(data.likes_count || 0);
      })
      .catch((err) => {
        setError(err.response?.status === 404 ? "NOT_FOUND" : "ERROR");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/feed", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="snx-app">
        <div className="snx-reel__loader">
          <div className="snx-reel__loader-spinner" />
        </div>
      </div>
    );
  }

  if (error === "NOT_FOUND") {
    return (
      <div className="snx-app">
        <div className="snx-reel__not-found">Reel not found</div>
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="snx-app">
        <div className="snx-reel__not-found">
          <p>Something went wrong</p>
          <button className="snx-reel__back" onClick={goBack} style={{ position: "static", margin: "20px auto" }}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="snx-app">
      <div className="snx-reel">
        <button className="snx-reel__back" onClick={goBack} aria-label="Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div className="snx-reel__container">
          <div className="snx-reel__player">
            {reel.video_url && (
              <video
                src={reel.video_url}
                controls
                autoPlay
                muted
                playsInline
                loop
                poster={reel.thumbnail_url}
              />
            )}
          </div>

          <div className="snx-reel__sidebar">
            <div
              className="snx-reel__user snx-reel__user-clickable"
              onClick={() => navigate(`/profile/${reel.user?.id}`)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") navigate(`/profile/${reel.user?.id}`); }}
            >
              {reel.user?.avatar_url && (
                <img
                  className="snx-reel__user-avatar"
                  src={reel.user.avatar_url}
                  alt={reel.user.username || "User avatar"}
                />
              )}
              <span className="snx-reel__user-name">
                {reel.user?.username || "Unknown"}
              </span>
            </div>

            {reel.caption && (
              <p className="snx-reel__caption">{reel.caption}</p>
            )}

            {reel.music_title && (
              <div className="snx-reel__music">
                <span>&#9835;</span> {reel.music_title}
              </div>
            )}

            <div className="snx-reel__actions">
              <button
                className={`snx-reel__action-btn ${liked ? "snx-reel__action-btn--liked" : ""}`}
                onClick={toggleLike}
                title={liked ? "Unlike" : "Like"}
                aria-label={liked ? "Unlike" : "Like"}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>{likesCount}</span>
              </button>

              <span className="snx-reel__stat">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>{reel.comments_count || 0}</span>
              </span>

              <span className="snx-reel__stat">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{reel.views_count || 0}</span>
              </span>

              <button
                className={`snx-reel__action-btn ${saved ? "snx-reel__action-btn--saved" : ""}`}
                onClick={toggleSave}
                title={saved ? "Unsave" : "Save"}
                aria-label={saved ? "Unsave" : "Save"}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
