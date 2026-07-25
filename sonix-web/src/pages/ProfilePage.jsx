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

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <Header />
      <div style={{ paddingTop: 60 }}>
        <div style={{ maxWidth: 935, margin: "0 auto", padding: "30px 20px 0" }}>
          <div style={{ display: "flex", gap: 60, marginBottom: 44, alignItems: "center" }}>
            <img src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.username}&background=6366f1&color=fff&size=200`}
              style={{ width: 150, height: 150, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="" />
            <div>
              <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 400, margin: "0 0 20px" }}>
                {profile?.username || "Unknown"}
              </h1>
              <div style={{ display: "flex", gap: 40, marginBottom: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{reels.length}</div>
                  <div style={{ color: "#888", fontSize: 14 }}>reels</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{profile?.followers_count || 0}</div>
                  <div style={{ color: "#888", fontSize: 14 }}>followers</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{profile?.following_count || 0}</div>
                  <div style={{ color: "#888", fontSize: 14 }}>following</div>
                </div>
              </div>
              {profile?.bio && <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>{profile.bio}</p>}
            </div>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4,
            borderTop: "1px solid #222", paddingTop: 4
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
