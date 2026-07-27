import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = id || me?.id;
    if (!userId) return;
    Promise.all([
      client.get(`/users/${userId}`).catch(() => ({ data: {} })),
      client.get(`/reels?user_id=${userId}`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([userRes, reelRes]) => {
        setProfile(userRes.data?.data || userRes.data?.user || userRes.data);
        const r = reelRes.data?.data || reelRes.data?.reels || reelRes.data;
        setReels(Array.isArray(r) ? r : r?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, me]);

  if (loading) {
    return (
      <div className="snx-app">
        <Header />
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="snx-reel__loader-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="snx-app">
      <Header />
      <div className="snx-profile">
        <div className="snx-profile__info">
          <img className="snx-profile__avatar" src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || "U"}&background=262626&color=f5f5f5&size=150`} alt={profile?.username} />
          <div className="snx-profile__details">
            <h2 className="snx-profile__username">{profile?.username || "Unknown"}</h2>
            <div className="snx-profile__stats">
              <span><span className="snx-profile__stat-num">{reels.length}</span> reels</span>
              <span><span className="snx-profile__stat-num">{profile?.followers_count || 0}</span> followers</span>
              <span><span className="snx-profile__stat-num">{profile?.following_count || 0}</span> following</span>
            </div>
            {profile?.bio && <p className="snx-profile__bio">{profile.bio}</p>}
          </div>
        </div>
        <p className="snx-profile__reels-title">Reels</p>
        {reels.length === 0 ? (
          <p style={{ textAlign: "center", color: "#737373", padding: 40 }}>No reels yet</p>
        ) : (
          <div className="snx-profile__grid">
            {reels.map((reel) => (
              <div key={reel.id} className="snx-profile__reel" onClick={() => navigate(`/reel/${reel.id}`)}>
                {reel.thumbnail_url ? (
                  <img src={reel.thumbnail_url} alt={reel.caption || "Reel"} loading="lazy" />
                ) : (
                  <video src={reel.video_url} muted loading="lazy" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
